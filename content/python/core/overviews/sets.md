A set holds unique values in no particular order. Membership tests are fast, and sets
support union, intersection and difference.

## Forms

```python form
s = {a, b, c}
s = set()
set(xs)
s.add(x)
s.discard(x)
a | b
a & b
a - b
```

## Examples

```python
unique = set([3, 1, 3, 2, 1])
len(unique)  # → 3
sorted(unique)  # → [1, 2, 3]
```

```python
a = {1, 2, 3}
b = {2, 3, 4}
a & b  # → {2, 3}
a | b  # → {1, 2, 3, 4}
a - b  # → {1}
```

```python
seen = set()
seen.add("x")
seen.add("x")
len(seen)  # → 1
"x" in seen  # → True
```

## Common slips

- `{}` is an empty dict. An empty set is `set()`.
- Sets have no order or indexes. `s[0]` is a **type error**, so use `sorted(s)` to get a
  list.
- `set("hello")` is a set of letters. For a set holding the one string, write
  `{"hello"}`.
- Set items must be immutable, so a list can't go in a set.
