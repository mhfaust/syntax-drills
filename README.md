# Syntax Drills

Adaptive, keyboard-first drills for getting a language's syntax into your fingers.
Short, literal exercises ("map these months to their totals"), timed, with no autocomplete.
Python first.

## Run it

```bash
npm install
npm run dev        # http://localhost:5199
```

Everything runs in the browser: Python via Pyodide, history in IndexedDB. Use
**Export history** on the home screen to back up your progress.

## Checks

```bash
npm run check      # typecheck + tests + module boundaries + content validation
```

## Using it

- **First time:** take the placement test (up to 15 exercises) or start from the beginning.
- **Daily:** one 10-minute session. Two warm-ups, then reviews and at most one new skill.
- **Levels:** each skill moves through *Copy* (type shown code), *Fill in* (complete the
  blanks) and *Write* (from scratch). Misses move it down; two clean passes move it up.
- **Keys:** <kbd>⌘</kbd><kbd>↵</kbd> checks your code, <kbd>↵</kbd> moves on after a pass.
- **Show answer** counts as a miss, then you retype the answer to continue.

## Adding exercises

Add a template to a file in `content/python/core/templates/` (the header of
`collections.yaml` explains the format), then run `npm run validate-content`.

See [docs/architecture.md](docs/architecture.md) for how it's put together.
