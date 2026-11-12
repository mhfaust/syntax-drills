A dict comprehension builds a dict in one expression: `key: value`, then the loop, then an
optional filter.

## Forms

```python form
{key_expr: value_expr for item in xs}
{k: v for k, v in d.items()}
{k: v for k, v in d.items() if condition}
```

## Examples

```python
{w: len(w) for w in ["fig", "kiwi"]}  # → {'fig': 3, 'kiwi': 4}
{n: n * n for n in range(3)}  # → {0: 0, 1: 1, 2: 4}
```

```python
prices = {"tea": 3, "cake": 5}
{k: v * 2 for k, v in prices.items()}  # → {'tea': 6, 'cake': 10}
{k: v for k, v in prices.items() if v > 4}  # → {'cake': 5}
{v: k for k, v in prices.items()}  # → {3: 'tea', 5: 'cake'}
```

## Common slips

- A loop that only does `d[k] = v` gets flagged. It's a dict comprehension.
- Put a colon between key and value. `{k, v for ...}` is a syntax error.
- To get pairs, loop over `.items()`. `for k, v in d` tries to unpack the keys, usually a
  **value error**.
- If two items produce the same key, the last one wins.
