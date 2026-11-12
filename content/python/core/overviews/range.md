`range` gives a sequence of integers. It starts at 0 by default, and the stop value is
never included.

## Forms

```python form
range(stop)
range(start, stop)
range(start, stop, step)
```

## Examples

```python
list(range(4))  # → [0, 1, 2, 3]
list(range(2, 6))  # → [2, 3, 4, 5]
list(range(0, 10, 3))  # → [0, 3, 6, 9]
list(range(5, 0, -1))  # → [5, 4, 3, 2, 1]
```

```python
total = 0
for i in range(1, 4):
    total += i
total  # → 6
```

## Common slips

- The stop value is left out. For 1 to n, write `range(1, n + 1)`.
- Counting down needs a negative step. `range(5, 0)` is empty.
- The arguments must be ints. `range(2.5)` is a **type error**, so use `//` to divide.
- To loop over a list, loop over the list itself. `range(len(xs))` gets flagged.
