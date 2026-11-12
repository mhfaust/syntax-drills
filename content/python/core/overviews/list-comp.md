A list comprehension builds a new list in one expression. The value comes first, then the
loop.

## Forms

```python form
[expression for item in collection]
```

## Examples

```python
[n * n for n in [1, 2, 3]]  # → [1, 4, 9]
[w.upper() for w in ["a", "b"]]  # → ['A', 'B']
[len(w) for w in "the quick fox".split()]  # → [3, 5, 3]
[i * ch for i, ch in enumerate("abc")]  # → ['', 'b', 'cc']
[x + y for x in [1, 2] for y in [10, 20]]  # → [11, 21, 12, 22]
```

## Common slips

- A loop that only appends gets flagged. `out = []` followed by
  `for x in xs: out.append(f(x))` becomes `out = [f(x) for x in xs]`.
- The value goes first: `[x * 2 for x in xs]`, not `[for x in xs: x * 2]`.
- Square brackets make a list. Parentheses make a generator, not a tuple.
- Two `for`s run in the same order as nested loops, outer one first.
