A dict maps keys to values. Use `d[key]` when the key must be there and `.get` when it
might be missing.

## Forms

```python form
d = {key: value, other_key: other_value}
d[key]
d[key] = value
d.get(key)
d.get(key, default)
del d[key]
```

## Examples

```python
ages = {"ada": 36, "alan": 41}
ages["ada"]  # → 36
ages["grace"] = 85
len(ages)  # → 3
ages.get("linus")  # → None
ages.get("linus", 0)  # → 0
del ages["alan"]
ages  # → {'ada': 36, 'grace': 85}
```

## Common slips

- `d[key]` with a missing key is a **key error**. Use `d.get(key, default)` instead.
- The literal uses colons: `{"a": 1}`. With a comma, `{"a", 1}` is a set.
- `.get(key, default)` doesn't store anything. Assign `d[key] = value` to add a key.
- Keys must be immutable. A list key is a **type error**, so use a tuple.
