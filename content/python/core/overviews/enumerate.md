`enumerate` pairs each item with its index, so you don't have to keep a counter.

## Forms

```python form
for i, item in enumerate(xs):
    body
for n, item in enumerate(xs, start=1):
    body
```

## Examples

```python
list(enumerate(["a", "b"]))  # → [(0, 'a'), (1, 'b')]
```

```python
for n, name in enumerate(["ada", "alan"], start=1):
    print(f"{n}. {name}")
```

```python
def index_of(xs, target):
    for i, x in enumerate(xs):
        if x == target:
            return i
    return -1

index_of(["x", "y", "z"], "z")  # → 2
```

## Common slips

- The index comes first: `for i, x in enumerate(xs)`, not `for x, i in ...`.
- Two patterns get flagged: `for i in range(len(xs))` with `xs[i]`, and keeping your own
  `i = 0` … `i += 1` counter.
- Counting starts at 0. To number from 1, pass `start=1` rather than adding 1 to `i`.
