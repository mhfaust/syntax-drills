"""Detects working-but-unidiomatic patterns in learner code.

Each detector adds a flag such as 'py.range-len-index'. Flags never fail an
attempt; the content pack maps each one to a message and to the skill that
teaches the idiom, which then gets scheduled sooner.
"""

import ast


def detect(tree):
    flags = set()
    for node in ast.walk(tree):
        if isinstance(node, ast.For):
            _check_loop(node, flags)
        elif isinstance(node, ast.Compare):
            _check_compare(node, flags)
    for block in _blocks(tree):
        _check_accumulators(block, flags)
    return sorted(flags)


def _check_loop(loop, flags):
    it = loop.iter
    if _is_call(it, "range") and len(it.args) == 1 and _is_call(it.args[0], "len"):
        flags.add("py.range-len-index")
    if _is_method_call(it, "keys") and not it.args:
        flags.add("py.keys-iteration")

    body = loop.body
    if len(body) == 1 and isinstance(body[0], ast.If) and not body[0].orelse:
        body = body[0].body
    if len(body) != 1:
        return
    stmt = body[0]
    # result.append(x) as the whole loop body, where x doesn't use result itself
    if isinstance(stmt, ast.Expr) and _is_method_call(stmt.value, "append"):
        target = stmt.value.func.value
        if isinstance(target, ast.Name) and not _uses_name(stmt.value.args, target.id):
            flags.add("py.append-loop")
    # d[k] = v as the whole loop body, where v doesn't read d (that would be accumulating)
    if (
        isinstance(stmt, ast.Assign)
        and len(stmt.targets) == 1
        and isinstance(stmt.targets[0], ast.Subscript)
        and isinstance(stmt.targets[0].value, ast.Name)
        and not _uses_name([stmt.value], stmt.targets[0].value.id)
    ):
        flags.add("py.dict-assign-loop")


def _check_compare(node, flags):
    operands = [node.left, *node.comparators]
    for op, left, right in zip(node.ops, operands, operands[1:]):
        if not isinstance(op, (ast.Eq, ast.NotEq)):
            continue
        if _is_const(left, None) or _is_const(right, None):
            flags.add("py.compare-to-none")
        elif _is_bool(left) or _is_bool(right):
            flags.add("py.compare-to-bool")
        elif (_is_call(left, "len") and _is_const(right, 0)) or (_is_call(right, "len") and _is_const(left, 0)):
            flags.add("py.len-comparison")


def _check_accumulators(block, flags):
    """`i = 0` ... `for ...: i += 1` (manual index) and `s = ''` ... `for ...: s += x` (concat)."""
    zeroed, empty = set(), set()
    for stmt in block:
        if isinstance(stmt, ast.Assign) and len(stmt.targets) == 1 and isinstance(stmt.targets[0], ast.Name):
            name = stmt.targets[0].id
            if _is_const(stmt.value, 0):
                zeroed.add(name)
            elif _is_const(stmt.value, ""):
                empty.add(name)
        if not isinstance(stmt, ast.For):
            continue
        for inner in stmt.body:
            if not (isinstance(inner, ast.AugAssign) and isinstance(inner.op, ast.Add) and isinstance(inner.target, ast.Name)):
                continue
            name = inner.target.id
            others = [s for s in stmt.body if s is not inner]
            if name in zeroed and _is_const(inner.value, 1) and _uses_name(others, name):
                flags.add("py.manual-counter")
            if name in empty:
                flags.add("py.string-concat-loop")


def _blocks(tree):
    for node in ast.walk(tree):
        for field in ("body", "orelse", "finalbody"):
            block = getattr(node, field, None)
            if isinstance(block, list) and block and isinstance(block[0], ast.stmt):
                yield block


def _is_call(node, name):
    return isinstance(node, ast.Call) and isinstance(node.func, ast.Name) and node.func.id == name


def _is_method_call(node, attr):
    return isinstance(node, ast.Call) and isinstance(node.func, ast.Attribute) and node.func.attr == attr


def _is_const(node, value):
    return isinstance(node, ast.Constant) and type(node.value) is type(value) and node.value == value


def _is_bool(node):
    return isinstance(node, ast.Constant) and isinstance(node.value, bool)


def _uses_name(nodes, name):
    return any(
        isinstance(n, ast.Name) and n.id == name
        for root in nodes
        for n in ast.walk(root)
    )
