# Ideas

Improvements to consider later. Nothing here is planned or built yet.

## Explanations of the language in prose

Link each skill to an explanation of the language feature it drills: external docs (the
Python tutorial or reference, for example) or short in-app write-ups.

- Likely places to show it: the skill list, the feedback after a miss, and the first time
  a skill is introduced.
- Likely shape: a `references` list on each skill in `skills.yaml` (title and URL), with
  in-app write-ups as Markdown files kept next to the content pack.

## Choosing a session length

Let the learner pick a 5-, 10- or 20-minute practice session instead of the fixed 10.

- Cheap to build: `SESSION_LENGTH_MS` in `src/core/engine/engine.ts` is read only by
  `useDrillSession.ts` (to end the session) and `SessionScreen.tsx` (for the countdown).
  Pass the length in from the home screen, and fix the "10-minute" copy in
  `HomeScreen.tsx`, the README and `docs/architecture.md`.
- The scheduler and exercise selection don't depend on session length, so nothing in the
  learning model has to change.
- Open question: `MAX_NEW_SKILLS_PER_SESSION` counts per session, so two 5-minute
  sessions would introduce two new skills a day. A per-day cap would keep new material
  arriving at the same pace however the time is split.
- Tradeoffs: in 5 minutes the two warm-ups and a new skill's intro (up to 6 exercises)
  leave little time for review. In 20 minutes the due reviews may run out, and the
  session falls back to "ahead" practice, which is worth less.
