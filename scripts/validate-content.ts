/*
 * Checks every content pack before it ships. Run with `npm run validate-content`.
 *
 * Structure: ids are unique, prerequisites exist and have no cycles, every skill has
 * single-skill templates, idioms point at real skills.
 * Behavior (in the same Pyodide the browser uses), for each template over many seeds:
 * generation is deterministic, nothing is left unrendered, the reference solution passes
 * its own checks without idiom flags, empty code and untouched blanks fail, and
 * single-skill templates have blanks for the fill level.
 */
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadPyodide } from 'pyodide';
import { buildSkillGraph } from '@/core/engine/skillGraph';
import { HARNESS_MODULES, installHarness, type HarnessSources } from '@/languages/python/harness';
import { loadPythonPack, type PythonTemplateSpec } from '@/languages/python/pythonContent';

const SEEDS = 20;
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const errors: string[] = [];
const warnings: string[] = [];

function readTree(dir: string): { path: string; text: string }[] {
  return readdirSync(dir, { withFileTypes: true, recursive: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.yaml'))
    .map((entry) => {
      const file = path.join(entry.parentPath, entry.name);
      return { path: path.relative(root, file), text: readFileSync(file, 'utf8') };
    });
}

const pack = loadPythonPack(readTree(path.join(root, 'content/python/core')));
const graph = buildSkillGraph(pack.skills);

/* ---------------------------------------------------------------- structure */

const duplicates = (ids: string[]) => ids.filter((id, i) => ids.indexOf(id) !== i);
for (const id of duplicates(pack.skills.map((s) => s.id))) errors.push(`duplicate skill id ${id}`);
for (const id of duplicates(pack.templates.map((t) => t.id)))
  errors.push(`duplicate template id ${id}`);

for (const skill of pack.skills) {
  for (const p of skill.prerequisites) {
    if (!graph.byId.has(p)) errors.push(`${skill.id} requires unknown skill ${p}`);
  }
  if (graph.ancestors(skill.id).has(skill.id))
    errors.push(`${skill.id} is part of a prerequisite cycle`);
  const single = pack.templates.filter(
    (t) => t.skillIds.length === 1 && t.skillIds[0] === skill.id,
  );
  if (single.length === 0) errors.push(`${skill.id} has no single-skill templates`);
  else if (single.length < 2) warnings.push(`${skill.id} has only one single-skill template`);
}
for (const template of pack.templates) {
  for (const id of template.skillIds) {
    if (!graph.byId.has(id)) errors.push(`${template.id} uses unknown skill ${id}`);
  }
}
for (const idiom of pack.idioms) {
  if (!graph.byId.has(idiom.skillId))
    errors.push(`idiom ${idiom.flag} points at unknown skill ${idiom.skillId}`);
}

/* ---------------------------------------------------------------- behavior */

const sources = Object.fromEntries(
  HARNESS_MODULES.map((name) => [
    name,
    readFileSync(path.join(root, `src/languages/python/harness/${name}.py`), 'utf8'),
  ]),
) as HarnessSources;
const harness = installHarness(await loadPyodide(), sources);

for (const template of pack.templates) {
  const spec = template.spec as PythonTemplateSpec;
  const fail = (seed: number, message: string) =>
    errors.push(`${template.id} (seed ${seed}): ${message}`);
  const setups = new Set<string>();
  let failures = 0;

  for (let seed = 1; seed <= SEEDS && failures < 3; seed++) {
    const before = errors.length;
    try {
      const compose = harness.instantiate(spec, seed, 'compose');
      const again = harness.instantiate(spec, seed, 'compose');
      if (JSON.stringify(compose) !== JSON.stringify(again))
        fail(seed, 'generation is not deterministic');
      setups.add(compose.setup + compose.prompt);

      for (const [label, text] of Object.entries({
        prompt: compose.prompt,
        setup: compose.setup,
        solution: compose.referenceCode,
      })) {
        if (/\{\{|\}\}|<<|>>/.test(text)) fail(seed, `${label} has unrendered markup: ${text}`);
      }

      const own = harness.grade(compose.payload, compose.referenceCode);
      if (own.outcome !== 'pass')
        fail(seed, `reference fails its own checks: ${own.message ?? own.outcome}`);
      else if (own.idiomFlags.length > 0)
        fail(seed, `reference is flagged: ${own.idiomFlags.join(', ')}`);

      const empty = harness.grade(compose.payload, '');
      if (empty.outcome === 'pass') fail(seed, 'empty code passes, so the checks test nothing');

      const fill = harness.instantiate(spec, seed, 'fill');
      if (template.skillIds.length === 1 && fill.scaffold !== 'fill') {
        fail(seed, 'single-skill template has no <<blanks>> for the fill level');
      }
      if (
        fill.scaffold === 'fill' &&
        harness.grade(fill.payload, fill.starterCode).outcome === 'pass'
      ) {
        fail(seed, 'fill starter passes without filling the blanks');
      }
    } catch (error) {
      fail(seed, `crashed: ${String(error).split('\n').slice(-3).join(' ')}`);
    }
    if (errors.length > before) failures += 1;
  }

  if (spec.generate.trim() !== '' && setups.size < 2) {
    warnings.push(`${template.id}: every seed generates the same exercise`);
  }
}

/* ---------------------------------------------------------------- report */

for (const w of warnings) console.warn(`warning: ${w}`);
for (const e of errors) console.error(`error: ${e}`);
console.log(
  `\n${pack.skills.length} skills, ${pack.templates.length} templates, ${SEEDS} seeds each: ` +
    `${errors.length} errors, ${warnings.length} warnings`,
);
process.exit(errors.length > 0 ? 1 : 0);
