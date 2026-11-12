Type hints document what a function takes and returns. Python doesn't check them when the
code runs.

## Forms

```python form
def f(param: int, other: str = "x") -> bool:
    body
name: int = value
list[int]
dict[str, int]
tuple[int, str]
int | None
```

## Examples

```python
def average(nums: list[float]) -> float:
    return sum(nums) / len(nums)

average([2.0, 4.0])  # → 3.0
```

```python
def find(names: list[str], target: str) -> int | None:
    for i, name in enumerate(names):
        if name == target:
            return i
    return None

find(["ada", "alan"], "alan")  # → 1
```

```python
def greet(name: str, excited: bool = False) -> str:
    return f"Hi, {name}{'!' if excited else '.'}"

greet("Ada", excited=True)  # → 'Hi, Ada!'
```

## Common slips

- The return type uses `->` after the parentheses, before the `:`.
- With a hint and a default, put spaces around `=`: `excited: bool = False`.
- Use the built-in types in hints: `list[int]` and `dict[str, int]`, not `List` from
  `typing`.
- Hints aren't enforced, so a wrong one won't raise an error. It just misleads readers.
