/*
 * Checks every content pack before it ships. Run with `npm run validate-content`.
 *
 * Structure: ids are unique, prerequisites exist and have no cycles, every skill has
 * single-skill templates, idioms point at real skills.
 * Behavior (in the same Pyodide the browser uses), for each template over many seeds:
 * generation is deterministic, nothing is left unrendered, the reference solution passes
 * its own checks without idiom flags, empty code and untouched blanks fail, and
 * single-skill templates have blanks for the fill level.
 * Overviews: every skill has one, and every Python block in it runs. ```python blocks run
 * top to bottom in a fresh namespace, and a top-level line ending in `# → value` must
 * evaluate to that repr (or, for print(...), print exactly that). ```python form blocks show
 * the shape of the syntax with placeholder names, so they are only compiled.
 */
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadPyodide } from 'pyodide';
import { parseMarkdown } from '@/app/reference/parseMarkdown';
import { buildSkillGraph } from '@/core/engine/skillGraph';
import { HARNESS_MODULES, installHarness, type HarnessSources } from '@/languages/python/harness';
import { loadPythonPack, type PythonTemplateSpec } from '@/languages/python/pythonContent';

const SEEDS = 20;
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const errors: string[] = [];
const warnings: string[] = [];

function readTree(dir: string): { path: string; text: string }[] {
  return readdirSync(dir, { withFileTypes: true, recursive: true })
    .filter((entry) => entry.isFile() && /\.(yaml|md)$/.test(entry.name))
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
for (const skill of pack.skills) {
  if (!skill.overview?.trim()) errors.push(`${skill.id} has no overview (overviews/<id>.md)`);
}
const skillIds = new Set(pack.skills.map((s) => s.id.replace(/^python\//, '')));
for (const file of readdirSync(path.join(root, 'content/python/core/overviews'))) {
  if (!skillIds.has(file.replace(/\.md$/, ''))) errors.push(`overview ${file} has no skill`);
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
const pyodide = await loadPyodide();
const harness = installHarness(pyodide, sources);

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

/* ---------------------------------------------------------------- overviews */

const CHECK_EXAMPLE = String.raw`
import ast, contextlib, io, json

def check_example(source, mode):
    if mode == "form":
        compile(source, "<form>", "exec")
        return "[]"
    lines = source.split("\n")
    tree = ast.parse(source)
    namespace = {"__name__": "__card__"}
    problems, checked = [], set()
    for stmt in tree.body:
        last = lines[stmt.end_lineno - 1]
        expected = last.split("# → ", 1)[1].strip() if "# → " in last else None
        out = io.StringIO()
        with contextlib.redirect_stdout(out):
            if expected is not None and isinstance(stmt, ast.Expr):
                checked.add(stmt.end_lineno)
                value = eval(compile(ast.Expression(stmt.value), "<card>", "eval"), namespace)
                call = stmt.value
                printed = isinstance(call, ast.Call) and isinstance(call.func, ast.Name) and call.func.id == "print"
                actual = out.getvalue().rstrip("\n") if printed else repr(value)
                if actual != expected:
                    problems.append(f"line {stmt.end_lineno}: shows {expected} but gives {actual}")
            else:
                exec(compile(ast.Module(body=[stmt], type_ignores=[]), "<card>", "exec"), namespace)
    for number, line in enumerate(lines, 1):
        if "# → " in line and number not in checked:
            problems.append(f"line {number}: '# →' is only checked after a top-level expression")
    return json.dumps(problems)
`;
pyodide.runPython(CHECK_EXAMPLE);
const checkExample = pyodide.globals.get('check_example') as (
  source: string,
  mode: string,
) => string;

let examples = 0;
for (const skill of pack.skills) {
  for (const block of parseMarkdown(skill.overview ?? '')) {
    if (block.kind !== 'code') continue;
    const [language, mode = 'run'] = block.info.split(/\s+/);
    if (language !== 'python') {
      errors.push(`${skill.id} overview: code block must be \`\`\`python or \`\`\`python form`);
      continue;
    }
    examples += 1;
    const first = block.code.split('\n')[0];
    try {
      const problems = JSON.parse(checkExample(block.code, mode)) as string[];
      for (const p of problems) errors.push(`${skill.id} overview, block "${first}": ${p}`);
    } catch (error) {
      errors.push(
        `${skill.id} overview, block "${first}": ${String(error).split('\n').slice(-2).join(' ')}`,
      );
    }
  }
}

/* ---------------------------------------------------------------- report */

for (const w of warnings) console.warn(`warning: ${w}`);
for (const e of errors) console.error(`error: ${e}`);
console.log(
  `\n${pack.skills.length} skills, ${pack.templates.length} templates, ${SEEDS} seeds each, ` +
    `${examples} overview examples: ${errors.length} errors, ${warnings.length} warnings`,
);
process.exit(errors.length > 0 ? 1 : 0);
