A conditional expression picks one of two values in a single line.

## Forms

```python form
value_if_true if condition else value_if_false
```

## Examples

```python
n = 7
"odd" if n % 2 else "even"  # → 'odd'
size = "big" if n > 10 else "small"
size  # → 'small'
```

```python
def plural(word, count):
    return word if count == 1 else word + "s"

plural("cat", 3)  # → 'cats'
plural("cat", 1)  # → 'cat'
```

## Common slips

- The order is `a if cond else b`. The `cond ? a : b` form from other languages is a
  syntax error.
- The `else` part is required. `x if cond` on its own is a syntax error.
- Use it to choose a value. For side effects or long branches, write an `if` statement.
