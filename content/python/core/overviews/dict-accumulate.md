To count or group, start with an empty dict and update one key per item. Use `.get` with a
default so new keys work too.

## Forms

```python form
counts = {}
for item in items:
    counts[item] = counts.get(item, 0) + 1
groups = {}
for item in items:
    groups.setdefault(key_of(item), []).append(item)
```

## Examples

```python
counts = {}
for word in "a b a c a".split():
    counts[word] = counts.get(word, 0) + 1
counts  # → {'a': 3, 'b': 1, 'c': 1}
```

```python
by_length = {}
for word in ["hi", "ok", "yes"]:
    by_length.setdefault(len(word), []).append(word)
by_length  # → {2: ['hi', 'ok'], 3: ['yes']}
```

```python
spend = {}
for name, amount in [("ada", 5), ("alan", 3), ("ada", 2)]:
    spend[name] = spend.get(name, 0) + amount
spend  # → {'ada': 7, 'alan': 3}
```

## Common slips

- `counts[k] += 1` on a new key is a **key error**. Start from `counts.get(k, 0)`.
- Create the dict before the loop. `counts = {}` inside the loop resets it every time.
- `d.get(k, []).append(x)` appends to a list that never gets stored. Use `setdefault`.
