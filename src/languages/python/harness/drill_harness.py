"""Entry points the JavaScript side calls: instantiate_json and grade_json.

Both take and return JSON strings, so the boundary with Pyodide stays simple.
The same module runs in the browser worker and in the Node content validator.
"""

import ast
import contextlib
import dataclasses
import io
import json
import math
import random
import re
import sys
import traceback
import types

import drill_errors
import drill_gen
import drill_idioms

LEARNER_FILE = "<your code>"
PLACEHOLDER = re.compile(r"\{\{(.+?)(!r)?\}\}")
BLANK = re.compile(r"<<(.+?)>>")
BLANK_TEXT = "___"

CONSTRUCT_NAMES = {
    "node:ListComp": "a list comprehension",
    "node:DictComp": "a dict comprehension",
    "node:SetComp": "a set comprehension",
    "node:GeneratorExp": "a generator expression",
    "node:JoinedStr": "an f-string",
    "node:Lambda": "a lambda",
    "node:IfExp": "a conditional expression (x if cond else y)",
    "node:While": "a while loop",
    "node:For": "a for loop",
    "node:With": "a with block",
    "node:Try": "try/except",
    "node:ClassDef": "a class",
    "node:Slice": "slicing",
    "node:Break": "break",
    "node:Continue": "continue",
    "node:keyword": "a keyword argument (name=value)",
    "annotation:arg": "type hints on the parameters",
    "annotation:return": "a return type hint (-> type)",
}


# ---------------------------------------------------------------- instantiate


def instantiate_json(request_json):
    request = json.loads(request_json)
    return json.dumps(instantiate(request["spec"], request["seed"], request["scaffold"]))


def instantiate(spec, seed, scaffold):
    params = _generate(spec.get("generate", ""), seed)
    marked = _render(spec["solution"], params).strip("\n")
    blanks = BLANK.findall(marked)
    reference = BLANK.sub(lambda m: m.group(1), marked)
    if scaffold == "fill" and not blanks:
        scaffold = "compose"
    check = spec.get("check", {})
    return {
        "scaffold": scaffold,
        "prompt": _render(spec["prompt"], params).strip(),
        "setup": _render(spec.get("setup", ""), params).strip("\n"),
        "starterCode": BLANK.sub(BLANK_TEXT, marked) if scaffold == "fill" else "",
        "referenceCode": reference,
        "targetChars": sum(len(b) for b in blanks) if scaffold == "fill" else _typed_chars(reference),
        "payload": {
            "setup": _render(spec.get("setup", ""), params),
            "solution": reference,
            "vars": [_render(v, params) for v in check.get("vars", [])],
            "calls": [_render(c, params) for c in check.get("calls", [])],
            "stdout": check.get("stdout", False),
            "require": spec.get("require", []),
            "allow": spec.get("allow", []),
        },
    }


def _generate(source, seed):
    namespace = {name: getattr(drill_gen, name) for name in drill_gen.__all__}
    namespace["rng"] = random.Random(seed)
    exec(source, namespace)
    return namespace


def _render(text, params):
    def replace(match):
        value = eval(match.group(1), {}, params)
        return repr(value) if match.group(2) else str(value)

    return PLACEHOLDER.sub(replace, text)


def _typed_chars(code):
    """Characters typed with auto-indent on: leading whitespace is free."""
    lines = code.splitlines()
    return sum(len(line.lstrip()) for line in lines) + max(0, len(lines) - 1)


# ---------------------------------------------------------------- grade


def grade_json(request_json):
    request = json.loads(request_json)
    return json.dumps(grade(request["payload"], request["code"]))


def grade(payload, code):
    try:
        tree = ast.parse(code, filename=LEARNER_FILE)
        compiled = compile(tree, LEARNER_FILE, "exec")
    except SyntaxError as error:
        error_class, line, message = drill_errors.classify_syntax(error)
        return _result("syntax-error", error_class, message, line)

    reference = _run(payload["setup"], compile(payload["solution"], "<reference>", "exec"))
    if reference.error is not None:
        raise RuntimeError(f"reference solution failed: {reference.error!r}")
    learner = _run(payload["setup"], compiled)
    if learner.error is not None:
        return _runtime_result(learner.error)

    for name in payload["vars"]:
        if name not in learner.namespace:
            return _result("fail", "py.missing-variable", f"Store your answer in `{name}`.")
        expected, actual = reference.namespace[name], learner.namespace[name]
        if not _same(expected, actual):
            return _result("fail", "py.wrong-result", f"`{name}` should be {_show(expected)}, but it is {_show(actual)}.")

    for call in payload["calls"]:
        expected = _evaluate(call, reference.namespace)
        try:
            actual = _evaluate(call, learner.namespace)
        except Exception as error:  # noqa: BLE001 - any learner error is reported
            error_class, message = drill_errors.classify_runtime(error)
            return _result("runtime-error", error_class, f"While checking `{call}`: {message}")
        if not _same(expected, actual):
            return _result("fail", "py.wrong-result", f"`{call}` should give {_show(expected)}, but gave {_show(actual)}.")

    if payload["stdout"] and learner.stdout != reference.stdout:
        return _result(
            "fail",
            "py.wrong-output",
            f"Expected this output:\n{reference.stdout or '(nothing)'}\nYour code printed:\n{learner.stdout or '(nothing)'}",
        )

    tokens = construct_tokens(tree)
    missing = [r for r in payload["require"] if r not in tokens]
    if missing:
        return _result("fail", "py.missing-construct", f"This one asks you to use {_describe(missing[0])}.")

    flags = [f for f in drill_idioms.detect(tree) if f not in payload["allow"]]
    return _result("pass", idiom_flags=flags)


@dataclasses.dataclass
class _Run:
    namespace: dict
    stdout: str
    error: BaseException | None


def _run(setup, compiled):
    """Runs setup then the code in a fresh module, so dataclasses and imports behave normally."""
    module = types.ModuleType("__drill__")
    module.__dict__["input"] = _no_input
    sys.modules["__drill__"] = module
    out = io.StringIO()
    error = None
    with contextlib.redirect_stdout(out):
        try:
            exec(setup, module.__dict__)
            exec(compiled, module.__dict__)
        except Exception as caught:  # noqa: BLE001 - reported to the learner
            error = caught
    return _Run(module.__dict__, out.getvalue(), error)


def _no_input(*_args):
    raise RuntimeError("input() isn't available in drills; use the variables provided.")


def _evaluate(snippet, namespace):
    """Runs a check snippet; its last line, if an expression, is the value."""
    tree = ast.parse(snippet)
    last = tree.body.pop() if tree.body and isinstance(tree.body[-1], ast.Expr) else None
    scope = dict(namespace)
    with contextlib.redirect_stdout(io.StringIO()):
        exec(compile(tree, "<check>", "exec"), scope)
        return eval(compile(ast.Expression(last.value), "<check>", "eval"), scope) if last else None


def _same(expected, actual):
    numbers = (int, float)
    if isinstance(expected, float) or isinstance(actual, float):
        return (
            isinstance(expected, numbers)
            and isinstance(actual, numbers)
            and not isinstance(actual, bool)
            and math.isclose(expected, actual, rel_tol=1e-9, abs_tol=1e-9)
        )
    if type(expected) is not type(actual):
        return False
    if isinstance(expected, (list, tuple)):
        return len(expected) == len(actual) and all(_same(e, a) for e, a in zip(expected, actual))
    if isinstance(expected, dict):
        return expected.keys() == actual.keys() and all(_same(v, actual[k]) for k, v in expected.items())
    return expected == actual


def _show(value, limit=120):
    text = repr(value)
    return text if len(text) <= limit else text[: limit - 1] + "…"


def construct_tokens(tree):
    tokens = set()
    for node in ast.walk(tree):
        tokens.add("node:" + type(node).__name__)
        if isinstance(node, ast.Call):
            if isinstance(node.func, ast.Name):
                tokens.add("call:" + node.func.id)
            elif isinstance(node.func, ast.Attribute):
                tokens.add("method:" + node.func.attr)
        if isinstance(node, ast.arg) and node.annotation is not None:
            tokens.add("annotation:arg")
        if isinstance(node, ast.FunctionDef) and node.returns is not None:
            tokens.add("annotation:return")
        if isinstance(node, (ast.FunctionDef, ast.ClassDef)):
            for decorator in node.decorator_list:
                target = decorator.func if isinstance(decorator, ast.Call) else decorator
                if isinstance(target, ast.Name):
                    tokens.add("decorator:" + target.id)
    return tokens


def _describe(token):
    if token in CONSTRUCT_NAMES:
        return CONSTRUCT_NAMES[token]
    kind, _, name = token.partition(":")
    return {"call": f"`{name}()`", "method": f"`.{name}()`", "decorator": f"`@{name}`"}.get(kind, f"`{name}`")


def _runtime_result(error):
    error_class, message = drill_errors.classify_runtime(error)
    frames = [f for f in traceback.extract_tb(error.__traceback__) if f.filename == LEARNER_FILE]
    return _result("runtime-error", error_class, message, frames[-1].lineno if frames else None)


def _result(outcome, error_class=None, message=None, line=None, idiom_flags=()):
    result = {"outcome": outcome, "idiomFlags": list(idiom_flags)}
    if error_class:
        result["errorClass"] = error_class
    if message:
        result["message"] = message
    if line:
        result["line"] = line
    return result
