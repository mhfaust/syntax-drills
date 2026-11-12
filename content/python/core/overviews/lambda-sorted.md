`sorted` returns a new sorted list. `key=` sorts by a computed value, and `reverse=True`
puts the largest first.

## Forms

```python form
sorted(xs)
sorted(xs, key=lambda x: expression)
sorted(xs, key=len, reverse=True)
xs.sort(key=function)
```

## Examples

```python
words = ["kiwi", "fig", "banana"]
sorted(words)  # → ['banana', 'fig', 'kiwi']
sorted(words, key=len)  # → ['fig', 'kiwi', 'banana']
sorted(words, key=len, reverse=True)  # → ['banana', 'kiwi', 'fig']
```

```python
people = [("ada", 36), ("alan", 41), ("grace", 30)]
sorted(people, key=lambda p: p[1])  # → [('grace', 30), ('ada', 36), ('alan', 41)]
sorted(people, key=lambda p: p[1], reverse=True)[0]  # → ('alan', 41)
```

```python
scores = {"ada": 90, "alan": 85}
sorted(scores, key=lambda name: scores[name])  # → ['alan', 'ada']
```

## Common slips

- `xs.sort()` sorts in place and returns `None`, so `ys = xs.sort()` loses the list. Use
  `sorted(xs)` for a new one.
- Pass the function, don't call it: `key=len`, not `key=len()`.
- `reverse` must be passed by name. `sorted(xs, True)` is a **type error**.
- A lambda is a single expression: no `return` and no statements.
