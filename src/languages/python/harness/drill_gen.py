"""Data helpers available to template generators.

A template's `generate` block runs with `rng` (a seeded random.Random) and every
name in __all__ below. Whatever variables it assigns can be used in the prompt,
setup and solution as {{name}} (str) or {{name!r}} (repr).
"""

from dataclasses import dataclass

__all__ = [
    "Labels",
    "labels",
    "ints",
    "prices",
    "words",
    "sentence",
    "pick",
    "sample",
    "WORDS",
    "FIRST_NAMES",
    "MONTHS",
]


@dataclass(frozen=True)
class Labels:
    one: str  # singular noun, e.g. "city"
    many: str  # plural, usable as a variable name, e.g. "cities"
    items: list


MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
FIRST_NAMES = ["Ana", "Ben", "Chen", "Dev", "Eli", "Fay", "Gus", "Ivy", "Jo", "Kai", "Lena", "Max"]

LABEL_POOLS = {
    "month": ("months", MONTHS),
    "city": ("cities", ["Austin", "Boston", "Chicago", "Denver", "Miami", "Oakland", "Portland", "Seattle", "Tampa", "Tulsa"]),
    "fruit": ("fruits", ["apple", "banana", "cherry", "grape", "kiwi", "lemon", "mango", "peach", "pear", "plum"]),
    "color": ("colors", ["red", "green", "blue", "amber", "teal", "violet", "coral", "olive"]),
    "player": ("players", FIRST_NAMES),
    "planet": ("planets", ["Mercury", "Venus", "Earth", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune"]),
    "tool": ("tools", ["hammer", "wrench", "saw", "drill", "pliers", "chisel", "level", "clamp"]),
}

WORDS = [
    "river", "stone", "cloud", "maple", "ember", "harbor", "lantern", "meadow", "orbit", "pepper",
    "quartz", "saddle", "thistle", "violet", "willow", "anchor", "basket", "candle", "dune", "falcon",
]


def labels(rng, n=None, kinds=None):
    """A random set of distinct labels of one kind. Months stay in calendar order."""
    kind = rng.choice(sorted(kinds or LABEL_POOLS))
    many, pool = LABEL_POOLS[kind]
    count = min(n or rng.randint(3, 5), len(pool))
    items = rng.sample(pool, count)
    if kind == "month":
        items.sort(key=pool.index)
    return Labels(kind, many, items)


def ints(rng, n, lo=1, hi=99):
    return [rng.randint(lo, hi) for _ in range(n)]


def prices(rng, n, lo=1, hi=50):
    return [round(rng.uniform(lo, hi), 2) for _ in range(n)]


def words(rng, n):
    return rng.sample(WORDS, n)


def sentence(rng, n):
    return " ".join(words(rng, n))


def pick(rng, seq):
    return rng.choice(list(seq))


def sample(rng, seq, k):
    return rng.sample(list(seq), k)
