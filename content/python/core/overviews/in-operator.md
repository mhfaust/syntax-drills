`in` tests membership and gives `True` or `False`. It looks for items in lists, sets and
tuples, keys in dicts, and substrings in strings.

## Forms

```python form
item in collection
item not in collection
```

## Examples

```python
3 in [1, 2, 3]  # → True
"ell" in "hello"  # → True
"x" not in "hello"  # → True
```

```python
ages = {"ada": 36}
"ada" in ages  # → True
36 in ages  # → False
36 in ages.values()  # → True
```

```python
color = "red"
color in ("red", "green")  # → True
```

## Common slips

- On a dict, `in` checks the keys. Use `in d.values()` to check the values.
- `x == "a" or "b"` is always true. Write `x in ("a", "b")`.
- Write `x not in xs` rather than `not x in xs`. Both work, but the first reads better.
- On a string, `in` finds substrings, not just single characters.
