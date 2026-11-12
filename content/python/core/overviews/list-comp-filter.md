An `if` at the end of a comprehension keeps only the items that pass. An `if … else`
before the `for` picks a value for every item instead.

## Forms

```python form
[item for item in xs if condition]
[f(item) for item in xs if condition]
[a if condition else b for item in xs]
```

## Examples

```python
nums = [3, -1, 4, -5, 9]
[n for n in nums if n > 0]  # → [3, 4, 9]
[n * 2 for n in nums if n % 2]  # → [6, -2, -10, 18]
[w for w in ["apple", "", "fig"] if w]  # → ['apple', 'fig']
[0 if n < 0 else n for n in nums]  # → [3, 0, 4, 0, 9]
```

## Common slips

- A filter `if` goes at the end. `[x for x in xs if x > 0 else 0]` is a syntax error. To
  choose a value, move the `if … else` before the `for`.
- A loop of the form `for x in xs: if cond: out.append(x)` gets flagged. It's this
  comprehension.
- The condition can use the loop name but not the result list, which doesn't exist yet.
