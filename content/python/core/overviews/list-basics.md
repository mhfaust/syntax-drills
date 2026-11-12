A list holds items in order. Indexes start at 0, and negative indexes count from the end.

## Forms

```python form
xs = [a, b, c]
xs[0]
xs[-1]
xs[i] = value
xs.append(item)
len(xs)
```

## Examples

```python
nums = [3, 1, 4]
nums[0]  # → 3
nums[-1]  # → 4
nums.append(1)
nums  # → [3, 1, 4, 1]
len(nums)  # → 4
nums[1] = 9
nums  # → [3, 9, 4, 1]
```

```python
names = []
names.append("ada")
names  # → ['ada']
```

## Common slips

- `xs[len(xs)]` is one past the end, an **index error**. The last item is `xs[-1]`.
- `append` changes the list and returns `None`, so `xs = xs.append(x)` throws the list away.
- `append` takes one item. `xs.append(a, b)` is a **type error**.
- Separate items with commas: `[1 2]` is a **missing comma** error.
