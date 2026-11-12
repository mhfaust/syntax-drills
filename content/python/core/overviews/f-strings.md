Put `f` before the quote and expressions inside `{}`. A format spec goes after a colon.

## Forms

```python form
f"text {expression} text"
f"{value:.2f}"
f"{value:>8}"
f"{value:05d}"
f"{value:,}"
```

## Examples

```python
name = "Ada"
price = 3.14159
f"Hi, {name}!"  # → 'Hi, Ada!'
f"{price:.2f}"  # → '3.14'
f"{len(name)} letters"  # → '3 letters'
f"{42:05d}"  # → '00042'
f"[{name:>5}]"  # → '[  Ada]'
f"[{name:<5}]"  # → '[Ada  ]'
f"{1234567:,}"  # → '1,234,567'
f"{0.256:.1%}"  # → '25.6%'
```

## Common slips

- Without the `f`, the braces stay in the string: `"{name}"` is just `'{name}'`.
- The spec goes inside the braces after a colon: `{x:.2f}`, not `{x}.2f` or `{x.2f}`.
- For a literal brace, double it: `f"{{x}}"` gives `'{x}'`.
- Unbalanced braces are an **fstring syntax** error.
