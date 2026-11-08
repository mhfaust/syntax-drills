# Architecture

A local-first browser app. Python runs in the browser (Pyodide in a Web Worker); practice
history lives in IndexedDB. There is no backend.

## Module map

```text
src/
  core/                 pure TypeScript: no React, no browser APIs, no Python
    model/              Skill, ItemTemplate, ItemInstance, Attempt, ids
    engine/             scheduling, selection, fluency, placement, summaries
    ports/              interfaces: LanguageRuntime, AttemptStore, IdentityProvider, Clock
    events.ts           domain events + a tiny bus
  languages/python/     Pyodide worker, Python harness (generate + grade), content loader
  adapters/             IndexedDB attempt store, local identity
  app/                  React UI: home, session, summary, skills, editor
  composition-root.ts   the one place implementations are wired to ports
content/python/core/    skills.yaml + templates/*.yaml
scripts/                validate-content.ts
```

## Dependency rules

Enforced by `npm run boundaries` (dependency-cruiser, see `.dependency-cruiser.cjs`):

| Module | May import |
|---|---|
| `core/` | only `core/` (plus pure libraries like ts-fsrs) |
| `languages/`, `adapters/` | `core/model` and `core/ports` |
| `app/` | `core/`; gets implementations through `AppServices` |
| `composition-root.ts`, `main.tsx` | anything |

## How a session works

1. On start, the app loads every attempt from the store and replays them through the
   engine (`engine.replay`) to rebuild learner state. Attempts are the only stored facts;
   skill state, schedules, mastery and summaries are all derived from them.
2. The engine picks the next item (`selection.ts`): warm-ups, then retries, then the
   session's new skill, then due reviews, then practice ahead of schedule.
3. The language runtime turns the template into a concrete exercise with a random seed
   (`instantiate`), and grades submissions (`grade`) by running the learner's code and the
   reference solution side by side and comparing results.
4. Each finished item becomes an `Attempt`, appended to the store and folded into state
   (`engine.apply`), which emits domain events.

## The adaptive model

| Piece | Where | What it does |
|---|---|---|
| Scaffold level | `learnerState.ts` | copy → fill → compose per skill; a fail drops one level, two first-try passes raise one |
| Review schedule | `reviewScheduler.ts` | one FSRS card per skill (ts-fsrs); fail → Again, slow → Hard, pass → Good, fluent → Easy; below compose, success is at most Hard |
| Difficulty match | `rating.ts`, `selection.ts` | Elo ratings for skills and templates; compose picks the template nearest 85% predicted success |
| Fluency | `fluency.ts` | target time = thinking allowance + characters ÷ typing speed; typing speed is learned from copy items |
| Mastery | `learnerState.ts` | 3 fluent compose attempts, 2+ templates, 3+ days, last compose not failed |
| Placement | `placement.ts` | tests the deepest untested skill; a pass marks all prerequisites known |

v0 simplifications worth knowing:

- A failed multi-skill item counts as a fail for every skill in it.
- Mastery days are UTC dates.
- A missed idiom makes its skill due now (or, if new, introduced next).
- Warm-ups prefer skills that are not due, so they don't give away a review's answer.

## Content

Templates are YAML (`content/python/core/templates/`). Each has a seeded `generate` block,
read-only `setup`, an idiomatic `solution` with `<<blanks>>` for the fill level, and
`check`s compared against the solution. `npm run validate-content` runs every template
over 20 seeds in Node's Pyodide and fails on anything that would mislead a learner.

## Where the future ideas plug in

| Idea | Seam that already exists | What's left |
|---|---|---|
| More languages | `LanguageRuntime`, namespaced ids and error classes, per-language content folders, `app/editor/languageModes.ts` | a runtime, a content pack and an editor mode per language; a language picker |
| Cloud deployment | static build (`npm run build`), code runs client-side | a host; a sync API for the attempt log once there are accounts |
| Login | `IdentityProvider`, `learnerId` on every attempt | an OAuth provider; claim `'local'` attempts on first sign-in |
| Gamification | `EventBus` with session, attempt and skill events; full history replayable | listeners and UI; XP/streaks can be computed from existing history |
