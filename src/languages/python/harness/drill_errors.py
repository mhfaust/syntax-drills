"""Turns Python errors into stable, namespaced error classes like 'py.missing-colon'.

The classes feed session summaries ("most common error") and, later, per-skill
error attribution. Python's own message is always shown to the learner as well.
"""

# Checked in order against SyntaxError.msg; the first match wins.
SYNTAX_RULES = [
    ("expected ':'", "py.missing-colon"),
    ("was never closed", "py.unclosed-bracket"),
    ("unmatched", "py.mismatched-bracket"),
    ("does not match opening parenthesis", "py.mismatched-bracket"),
    ("forgot a comma", "py.missing-comma"),
    ("unterminated", "py.unterminated-string"),
    ("f-string", "py.fstring-syntax"),
    ("Maybe you meant '=='", "py.assign-vs-compare"),
    ("cannot assign to", "py.bad-assignment"),
    ("expected 'in'", "py.for-syntax"),
    ("Did you mean", "py.keyword-typo"),
]

RUNTIME_CLASSES = {
    "NameError": "py.name-error",
    "UnboundLocalError": "py.name-error",
    "AttributeError": "py.attribute-error",
    "TypeError": "py.type-error",
    "KeyError": "py.key-error",
    "IndexError": "py.index-error",
    "ValueError": "py.value-error",
    "ZeroDivisionError": "py.zero-division",
    "RecursionError": "py.recursion",
}


def classify_syntax(error):
    if isinstance(error, IndentationError):
        error_class = "py.indentation"
    else:
        error_class = next(
            (cls for needle, cls in SYNTAX_RULES if needle in (error.msg or "")),
            "py.invalid-syntax",
        )
    return error_class, error.lineno, f"{type(error).__name__}: {error.msg}"


def classify_runtime(error):
    name = type(error).__name__
    return RUNTIME_CLASSES.get(name, "py.runtime-error"), f"{name}: {error}"
