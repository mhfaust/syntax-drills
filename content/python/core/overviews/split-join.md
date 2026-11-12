`split` breaks a string into a list. `join` glues a list of strings back together, with
the separator it's called on between them.

## Forms

```python form
s.split()
s.split(separator)
separator.join(strings)
```

## Examples

```python
"a b  c".split()  # → ['a', 'b', 'c']
"a b  c".split(" ")  # → ['a', 'b', '', 'c']
"2024-05-01".split("-")  # → ['2024', '05', '01']
", ".join(["x", "y", "z"])  # → 'x, y, z'
"".join(["a", "b"])  # → 'ab'
"-".join(str(n) for n in [1, 2, 3])  # → '1-2-3'
```

```python
words = "the quick fox".split()
" ".join(reversed(words))  # → 'fox quick the'
```

## Common slips

- `join` is called on the separator: `", ".join(xs)`. `xs.join(", ")` is an
  **attribute error**.
- `join` only takes strings. `",".join([1, 2])` is a **type error**, so convert with
  `str(n)` first.
- Building a string with `s += x` in a loop gets flagged. Collect the parts and
  `"".join` them.
- `split(" ")` keeps empty strings between repeated spaces. Plain `split()` doesn't.
