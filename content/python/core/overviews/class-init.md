A class bundles data and the functions that work on it. `__init__` sets up a new object,
and every method takes `self` first.

## Forms

```python form
class Name:
    def __init__(self, param):
        self.attribute = param

    def method(self):
        return self.attribute

obj = Name(arg)
obj.method()
```

## Examples

```python
class Counter:
    def __init__(self, start=0):
        self.count = start

    def increment(self):
        self.count += 1

c = Counter()
c.increment()
c.increment()
c.count  # → 2
Counter(10).count  # → 10
```

```python
class Rectangle:
    def __init__(self, width, height):
        self.width = width
        self.height = height

    def area(self):
        return self.width * self.height

Rectangle(3, 4).area()  # → 12
```

## Common slips

- Every method takes `self` first. Leave it out and calling the method is a
  **type error**.
- Store attributes on `self` (`self.width = width`). A bare `width = width` makes a local
  variable that's gone after `__init__` returns.
- Use two underscores on each side: `__init__`.
- Inside a method, read attributes as `self.x`. A bare `x` is a **name error**.
