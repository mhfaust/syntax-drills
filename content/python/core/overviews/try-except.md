Put the line that might fail in `try`, and say how to recover in `except`. Name the
exception you expect.

## Forms

```python form
try:
    risky()
except ValueError:
    recover()
except (KeyError, IndexError) as error:
    handle(error)
else:
    ran_if_nothing_raised()
finally:
    always_runs()
```

## Examples

```python
def to_int(text, default=0):
    try:
        return int(text)
    except ValueError:
        return default

to_int("42")  # → 42
to_int("forty")  # → 0
```

```python
def safe_divide(a, b):
    try:
        return a / b
    except ZeroDivisionError:
        return None

safe_divide(6, 3)  # → 2.0
safe_divide(1, 0)  # → None
```

```python
try:
    {}["missing"]
except KeyError as error:
    message = f"no key {error}"
message  # → "no key 'missing'"
```

## Common slips

- Catch a specific exception (`except ValueError:`). A bare `except:` hides real bugs.
- Keep `try` small, just the line that can fail.
- It's `except`, not `catch`. Bind the exception with `as`: `except KeyError as error:`.
- Every clause ends in `:` (**missing colon**).
