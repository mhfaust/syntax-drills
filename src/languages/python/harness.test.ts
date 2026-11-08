import { readFileSync } from 'node:fs';
import path from 'node:path';
import { loadPyodide } from 'pyodide';
import { beforeAll, describe, expect, it } from 'vitest';
import {
  HARNESS_MODULES,
  installHarness,
  type Harness,
  type HarnessSources,
} from '@/languages/python/harness';
import { pythonTemplateSpecSchema } from '@/languages/python/pythonContent';

/* Runs the real harness in Node's Pyodide, the same build the browser uses. */
let harness: Harness;
beforeAll(async () => {
  const dir = path.join(import.meta.dirname, 'harness');
  const sources = Object.fromEntries(
    HARNESS_MODULES.map((name) => [name, readFileSync(path.join(dir, `${name}.py`), 'utf8')]),
  ) as HarnessSources;
  harness = installHarness(await loadPyodide(), sources);
}, 30_000);

const spec = pythonTemplateSpecSchema.parse({
  id: 'zip-to-dict',
  skills: ['zip'],
  prompt: 'Map each of `{{L.many}}` to its total in `totals`, using zip.',
  generate: "L = labels(rng, n=3, kinds=['month'])\ntotals = ints(rng, 3)",
  setup: '{{L.many}} = {{L.items!r}}\ntotals = {{totals!r}}',
  solution: 'result = dict(<<zip({{L.many}}, totals)>>)',
  check: { vars: ['result'] },
  require: ['call:zip'],
});

const grade = (code: string) =>
  harness.grade(harness.instantiate(spec, 7, 'compose').payload, code);

describe('instantiate', () => {
  it('renders placeholders and is deterministic per seed', () => {
    const a = harness.instantiate(spec, 7, 'compose');
    expect(a.setup).toMatch(/^months = \[.+\]\ntotals = \[.+\]$/);
    expect(a.referenceCode).toBe('result = dict(zip(months, totals))');
    expect(harness.instantiate(spec, 7, 'compose')).toEqual(a);
    expect(harness.instantiate(spec, 8, 'compose').setup).not.toBe(a.setup);
  });

  it('turns <<blanks>> into ___ at the fill level', () => {
    const fill = harness.instantiate(spec, 7, 'fill');
    expect(fill.starterCode).toBe('result = dict(___)');
    expect(fill.targetChars).toBe('zip(months, totals)'.length);
  });
});

describe('grade', () => {
  it('passes any correct answer, not just the reference', () => {
    expect(grade('result = dict(zip(months, totals))').outcome).toBe('pass');
    expect(grade('result = {}\nfor m, t in zip(months, totals):\n    result[m] = t')).toMatchObject(
      {
        outcome: 'pass',
        idiomFlags: ['py.dict-assign-loop'],
      },
    );
  });

  it('classifies syntax errors with the line', () => {
    expect(grade('for m in months\n    pass')).toMatchObject({
      outcome: 'syntax-error',
      errorClass: 'py.missing-colon',
      line: 1,
    });
    expect(grade('result = dict(zip(months, totals)')).toMatchObject({
      errorClass: 'py.unclosed-bracket',
    });
    expect(grade('for m in months:\npass')).toMatchObject({ errorClass: 'py.indentation' });
  });

  it('reports runtime errors on the learner line', () => {
    expect(grade('x = 1\nresult = dict(zipp(months, totals))')).toMatchObject({
      outcome: 'runtime-error',
      errorClass: 'py.name-error',
      line: 2,
    });
  });

  it('explains wrong and missing results', () => {
    expect(grade('result = dict(zip(totals, months))')).toMatchObject({
      outcome: 'fail',
      errorClass: 'py.wrong-result',
    });
    expect(grade('answer = 1')).toMatchObject({
      outcome: 'fail',
      errorClass: 'py.missing-variable',
    });
  });

  it('fails when a construct the prompt asks for is missing', () => {
    expect(grade('result = {m: totals[i] for i, m in enumerate(months)}')).toMatchObject({
      outcome: 'fail',
      errorClass: 'py.missing-construct',
      message: 'This one asks you to use `zip()`.',
    });
  });

  it('flags common unidiomatic patterns', () => {
    const flags = (code: string) => grade(`result = dict(zip(months, totals))\n${code}`).idiomFlags;
    expect(flags('for i in range(len(months)):\n    print(i)')).toEqual(['py.range-len-index']);
    expect(flags('out = []\nfor m in months:\n    out.append(m)')).toEqual(['py.append-loop']);
    expect(flags('i = 0\nfor m in months:\n    print(i, m)\n    i += 1')).toEqual([
      'py.manual-counter',
    ]);
    expect(flags('if result == None:\n    pass')).toEqual(['py.compare-to-none']);
    expect(flags('s = ""\nfor m in months:\n    s += m')).toEqual(['py.string-concat-loop']);
    expect(flags('n = 0\nfor m in months:\n    if m:\n        n += 1')).toEqual([]);
  });

  it('blocks input()', () => {
    expect(grade('result = input()')).toMatchObject({ outcome: 'runtime-error' });
  });
});
