`zip` walks several collections at once and gives you a tuple of one item from each.

## Forms

```python form
for a, b in zip(xs, ys):
    body
list(zip(xs, ys))
dict(zip(keys, values))
```

## Examples

```python
names = ["ada", "alan"]
scores = [90, 85]
list(zip(names, scores))  # → [('ada', 90), ('alan', 85)]
dict(zip(names, scores))  # → {'ada': 90, 'alan': 85}
```

```python
total = 0
for price, qty in zip([2, 5], [3, 1]):
    total += price * qty
total  # → 11
```

```python
list(zip("ab", [1, 2, 3]))  # → [('a', 1), ('b', 2)]
```

## Common slips

- `zip` stops at the shortest input without any warning. Pass `strict=True` if the lengths
  must match.
- `zip` gives an iterator, which you can only use once. Wrap it in `list(...)` to keep it.
- Don't index both lists with `range(len(xs))`. `zip` walks them together.
