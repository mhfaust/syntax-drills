`def` names a block of code that takes parameters. `return` hands a value back to the
caller and ends the function.

## Forms

```python form
def name(param, other_param):
    body
    return value
```

## Examples

```python
def area(width, height):
    return width * height

area(3, 4)  # → 12
```

```python
def first_even(nums):
    for n in nums:
        if n % 2 == 0:
            return n
    return None

first_even([3, 8, 5])  # → 8
first_even([1, 3])  # → None
```

## Common slips

- A function without `return` returns `None`. `print` shows a value but doesn't return it.
- `return` ends the function, so code after it in the same block never runs.
- The header needs parentheses and a colon: `def f(x):` (**missing colon**).
- `area` is the function itself. `area(3, 4)` calls it.
