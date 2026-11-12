`@dataclass` writes `__init__`, `__repr__` and `==` for you from a list of typed fields.

## Forms

```python form
from dataclasses import dataclass, field

@dataclass
class Name:
    required: int
    optional: str = "default"
    items: list[str] = field(default_factory=list)
```

## Examples

```python
from dataclasses import dataclass

@dataclass
class Point:
    x: int
    y: int = 0

p = Point(3, 4)
p  # → Point(x=3, y=4)
p.x  # → 3
Point(1) == Point(1, 0)  # → True
```

```python
from dataclasses import dataclass, field

@dataclass
class Cart:
    owner: str
    items: list[str] = field(default_factory=list)

Cart("ada")  # → Cart(owner='ada', items=[])
```

## Common slips

- A field needs a type hint. `x = 0` without one isn't a field.
- Fields with defaults come after fields without them, or defining the class is a
  **type error**.
- A mutable default like `items: list = []` is a **value error**. Use
  `field(default_factory=list)`.
- `@dataclass` goes on the line above `class`, and needs
  `from dataclasses import dataclass`.
