Assign several names at once from a tuple, list or any other sequence. This works in `for`
headers too.

## Forms

```python form
a, b = pair
a, b = b, a
first, *rest = xs
for name, score in pairs:
    body
```

## Examples

```python
x, y = (3, 4)
x  # → 3
a, b = 1, 2
a, b = b, a
(a, b)  # → (2, 1)
first, *rest = [1, 2, 3]
rest  # → [2, 3]
q, r = divmod(17, 5)
(q, r)  # → (3, 2)
```

```python
pairs = [("ada", 90), ("alan", 85)]
for name, score in pairs:
    print(name, score)
```

## Common slips

- The counts must match. `a, b = [1, 2, 3]` is a **value error**.
- Swap with `a, b = b, a`. You don't need a temporary variable.
- In a loop, unpack in the header (`for name, score in pairs`) rather than indexing
  `pair[0]` and `pair[1]`.
