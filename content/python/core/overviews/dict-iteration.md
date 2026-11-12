Looping over a dict gives its keys. Use `.items()` for key-value pairs and `.values()` for
just the values.

## Forms

```python form
for key in d:
    body
for key, value in d.items():
    body
for value in d.values():
    body
```

## Examples

```python
prices = {"tea": 3, "cake": 5}
list(prices)  # → ['tea', 'cake']
sum(prices.values())  # → 8
```

```python
prices = {"tea": 3, "cake": 5}
for item, price in prices.items():
    print(f"{item}: {price}")
```

```python
prices = {"tea": 3, "cake": 5}
cheap = []
for item, price in prices.items():
    if price < 4:
        cheap.append(item.upper())
    else:
        cheap.append(item)
cheap  # → ['TEA', 'cake']
```

## Common slips

- Looping over `d.keys()` gets flagged. `for k in d` already gives the keys.
- `for k, v in d:` tries to split each key in two, usually a **value error**. Loop over
  `d.items()`.
- `.items()` needs its parentheses.
- Adding or removing keys while looping over a dict is an error. Loop over `list(d)`
  instead.
