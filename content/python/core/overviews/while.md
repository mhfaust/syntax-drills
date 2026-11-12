`while` repeats its body as long as the condition stays true. It's for "until" loops where
you don't know the count ahead of time.

## Forms

```python form
while condition:
    body
while True:
    body
    if done:
        break
```

## Examples

```python
n = 1
while n < 100:
    n *= 2
n  # → 128
```

```python
digits = 0
x = 4096
while x > 0:
    x //= 10
    digits += 1
digits  # → 4
```

```python
stack = [1, 2, 3]
total = 0
while stack:
    total += stack.pop()
total  # → 6
```

## Common slips

- Change what the condition depends on, or the loop never ends. In the drills that's a
  timeout.
- Use `for` to walk a collection or a known range. Save `while` for loops that run until
  something happens.
- Python has no `x++` or `do … while`. Write `x += 1`.
- The header ends in `:` (**missing colon**).
