Python runs the first branch whose condition is true. `elif` and `else` are optional.

## Forms

```python form
if condition:
    body
elif other_condition:
    body
else:
    body
```

## Examples

```python
def sign(n):
    if n > 0:
        return "positive"
    elif n < 0:
        return "negative"
    else:
        return "zero"

sign(-3)  # → 'negative'
sign(0)  # → 'zero'
```

```python
age = 15
if 13 <= age < 20 and age != 16:
    group = "teen"
else:
    group = "other"
group  # → 'teen'
```

## Common slips

- `=` assigns and `==` compares. `if x = 3:` is an **assign vs compare** error.
- It's `elif`, not `else if` or `elseif`.
- Every header ends in `:`, `else:` included (**missing colon**).
- Combine conditions with `and`, `or` and `not`, not `&&`, `||` and `!`.
