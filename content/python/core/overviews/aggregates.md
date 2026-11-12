Built-in functions that sum up a whole collection in one call.

## Forms

```python form
sum(xs)
min(xs)
max(xs)
len(xs)
max(xs, key=function)
min(xs, default=value)
```

## Examples

```python
nums = [4, 8, 15, 16]
sum(nums)  # → 43
min(nums)  # → 4
max(nums)  # → 16
len(nums)  # → 4
sum(nums) / len(nums)  # → 10.75
min(3, 7, 1)  # → 1
max(["fig", "banana", "kiwi"], key=len)  # → 'banana'
max([], default=0)  # → 0
```

## Common slips

- `min` and `max` of an empty list are a **value error**. Pass `default=` or check first.
- `sum` only adds numbers. For strings, use `"".join(...)`. `sum(["a"])` is a
  **type error**.
- These are functions, not methods: `len(xs)`, not `xs.len()` or `xs.length`
  (**attribute error**).
- Don't use them as variable names. After `sum = 0`, calling `sum(xs)` is a **type error**.
