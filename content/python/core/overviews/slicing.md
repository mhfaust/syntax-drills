A slice copies part of a list or string. The start is included, the stop is not, and any
part can be left out.

## Forms

```python form
xs[start:stop]
xs[start:]
xs[:stop]
xs[::step]
xs[::-1]
```

## Examples

```python
letters = "abcdef"
letters[1:4]  # → 'bcd'
letters[:2]  # → 'ab'
letters[-2:]  # → 'ef'
letters[::2]  # → 'ace'
letters[::-1]  # → 'fedcba'
```

```python
nums = [10, 20, 30, 40]
nums[1:]  # → [20, 30, 40]
nums[:-1]  # → [10, 20, 30]
nums[5:9]  # → []
```

## Common slips

- The stop is left out, so `xs[1:3]` has two items.
- Use colons, not commas. On a list, `xs[1, 3]` is a **type error**.
- Slices never fail. `xs[5:100]` is just shorter or empty, while `xs[100]` is an
  **index error**.
- The last n items are `xs[-n:]`. Everything but the last is `xs[:-1]`.
