Strings never change. Each method returns a new string (or a bool or number) and leaves
the original as it was.

## Forms

```python form
s.strip()
s.lower()
s.upper()
s.title()
s.replace(old, new)
s.startswith(prefix)
s.endswith(suffix)
s.count(sub)
s.find(sub)
s.isdigit()
```

## Examples

```python
raw = "  Hello World  "
raw.strip()  # → 'Hello World'
raw.strip().lower()  # → 'hello world'
"a-b-c".replace("-", "+")  # → 'a+b+c'
"report.pdf".endswith(".pdf")  # → True
"banana".count("a")  # → 3
"banana".find("n")  # → 2
"banana".find("z")  # → -1
"42".isdigit()  # → True
"ada lovelace".title()  # → 'Ada Lovelace'
```

## Common slips

- `s.strip()` on its own line does nothing. Keep the result: `s = s.strip()`.
- `s.lower` without parentheses is the method itself, not the lowercased string.
- Names from other languages, like `s.trim()` or `s.startsWith()`, are **attribute error**s.
- `.strip()` only trims the ends. To remove spaces in the middle, use `.replace(" ", "")`.
