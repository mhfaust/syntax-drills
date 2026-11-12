Pass arguments by name with `name=value`. Named arguments can go in any order, but they
come after the positional ones.

## Forms

```python form
f(positional, name=value)
f(b=2, a=1)
def f(a, *, flag=False):
    body
```

## Examples

```python
def box(width, height, fill="#"):
    return "\n".join([fill * width] * height)

box(3, 2)  # → '###\n###'
box(height=1, width=2)  # → '##'
box(2, 1, fill="*")  # → '**'
```

```python
sorted([3, 1, 2], reverse=True)  # → [3, 2, 1]
print("a", "b", sep="-")  # → a-b
```

## Common slips

- Positional arguments come first. `f(width=3, 2)` is a syntax error.
- The name must match a parameter. `box(widht=3, height=1)` is a **type error**.
- Giving the same argument twice, as in `box(3, width=3)`, is a **type error**.
- By convention there are no spaces around `=` in a call: `fill="*"`.
