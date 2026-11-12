`break` leaves the loop. `continue` skips to the next item. A loop's `else` block runs only
if the loop finished without a `break`.

## Forms

```python form
for item in xs:
    if skip_this:
        continue
    if stop_now:
        break
    body
for item in xs:
    if found:
        break
else:
    no_break_happened
```

## Examples

```python
first_negative = None
for n in [4, 2, -1, 7, -3]:
    if n < 0:
        first_negative = n
        break
first_negative  # → -1
```

```python
odd_total = 0
for n in range(6):
    if n % 2 == 0:
        continue
    odd_total += n
odd_total  # → 9
```

```python
for n in [3, 5, 7]:
    if n % 2 == 0:
        result = "has an even number"
        break
else:
    result = "all odd"
result  # → 'all odd'
```

## Common slips

- `break` only leaves the innermost loop.
- `break` or `continue` outside a loop is a syntax error.
- In a `while` loop, `continue` also skips any update after it, which can loop forever.
- Inside a function, `return` from the loop is often clearer than `break` plus a flag.
