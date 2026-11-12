`for` runs its body once for each item, with the loop name bound to that item.

## Forms

```python form
for item in collection:
    body
```

## Examples

```python
total = 0
for n in [2, 3, 5]:
    total += n
total  # → 10
```

```python
for ch in "abc":
    print(ch.upper())
```

```python
longest = ""
for word in ["fig", "banana", "kiwi"]:
    if len(word) > len(longest):
        longest = word
longest  # → 'banana'
```

## Common slips

- The header ends with `:` (**missing colon**) and the body is indented four spaces
  (**indentation**).
- It's `for x in xs:`. Forms from other languages, like `for (x in xs)` or `for x of xs`,
  are syntax errors.
- Reassigning the loop name (`x = x * 2`) doesn't change the list.
- Loop over the items themselves. `for i in range(len(xs))` and then `xs[i]` gets flagged.
