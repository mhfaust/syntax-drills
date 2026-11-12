`any` asks whether at least one item is true, and `all` whether every item is. Both
usually take a generator expression.

## Forms

```python form
any(condition for item in xs)
all(condition for item in xs)
```

## Examples

```python
nums = [3, 8, 12]
any(n > 10 for n in nums)  # → True
all(n > 0 for n in nums)  # → True
all(n % 2 == 0 for n in nums)  # → False
```

```python
words = ["Ada", "alan"]
all(w[0].isupper() for w in words)  # → False
any([])  # → False
all([])  # → True
```

## Common slips

- They take one iterable: `any(x > 0 for x in xs)`, not `any(x > 0, xs)`.
- You don't need square brackets. Without them, they stop at the first item that decides
  the answer.
- `all([])` is `True`, because no item fails.
- They replace the flag pattern: `found = False`, then a loop that sets `found = True`.
