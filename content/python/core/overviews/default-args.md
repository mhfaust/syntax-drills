A parameter with `=value` is optional. If the caller leaves it out, it takes that value.

## Forms

```python form
def f(required, optional=default):
    body
def f(items=None):
    if items is None:
        items = []
```

## Examples

```python
def greet(name, greeting="Hello"):
    return f"{greeting}, {name}!"

greet("Ada")  # → 'Hello, Ada!'
greet("Ada", "Hi")  # → 'Hi, Ada!'
```

```python
def add_item(item, items=None):
    if items is None:
        items = []
    items.append(item)
    return items

add_item("a")  # → ['a']
add_item("b")  # → ['b']
```

## Common slips

- Parameters with defaults come after the ones without. `def f(a=1, b):` is a syntax
  error.
- A mutable default like `items=[]` is created once and shared by every call. Default to
  `None` and create the list inside.
- By convention there are no spaces around `=` in a default: `width=10`.
