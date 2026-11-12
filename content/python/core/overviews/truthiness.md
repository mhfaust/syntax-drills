`0`, `''`, `[]`, `{}`, `set()` and `None` are falsy, and almost everything else is truthy.
Test a value directly, and test for `None` with `is`.

## Forms

```python form
if xs:
    body
if not xs:
    body
if x is None:
    body
if x is not None:
    body
```

## Examples

```python
bool([])  # → False
bool("0")  # → True
bool(0)  # → False
```

```python
def describe(items):
    if not items:
        return "empty"
    return f"{len(items)} items"

describe([])  # → 'empty'
describe([1, 2])  # → '2 items'
```

```python
def label(name=None):
    if name is None:
        return "anonymous"
    return name

label()  # → 'anonymous'
label("")  # → ''
```

## Common slips

These all get flagged:

- `if x == None:` should be `if x is None:`.
- `if done == True:` should be `if done:`, and `if done == False:` should be `if not done:`.
- `if len(xs) == 0:` should be `if not xs:`.

And when `0` or `""` is a real value, test `is None` instead of truthiness.
