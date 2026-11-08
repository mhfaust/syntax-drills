import type { PyodideAPI } from 'pyodide';
import type { Scaffold } from '@/core/model/content';
import type { GradeResult } from '@/core/ports/language';
import type { PythonTemplateSpec } from '@/languages/python/pythonContent';

/*
 * Installs the Python harness modules into a Pyodide instance and exposes them as typed
 * functions. Shared by the browser worker and the Node content validator, which load the
 * module sources differently (Vite ?raw imports vs. the filesystem).
 */

export const HARNESS_MODULES = [
  'drill_gen',
  'drill_errors',
  'drill_idioms',
  'drill_harness',
] as const;
export type HarnessSources = Record<(typeof HARNESS_MODULES)[number], string>;

export type InstantiateResult = {
  scaffold: Scaffold;
  prompt: string;
  setup: string;
  starterCode: string;
  referenceCode: string;
  targetChars: number;
  payload: unknown;
};

export type Harness = {
  instantiate(spec: PythonTemplateSpec, seed: number, scaffold: Scaffold): InstantiateResult;
  grade(payload: unknown, code: string): GradeResult;
};

export function installHarness(pyodide: PyodideAPI, sources: HarnessSources): Harness {
  const dir = '/home/pyodide';
  for (const name of HARNESS_MODULES) pyodide.FS.writeFile(`${dir}/${name}.py`, sources[name]);
  pyodide.runPython(
    `import sys\nif ${JSON.stringify(dir)} not in sys.path: sys.path.insert(0, ${JSON.stringify(dir)})`,
  );
  const module = pyodide.pyimport('drill_harness');
  const call = (fn: string, request: unknown) =>
    JSON.parse(module[fn](JSON.stringify(request)) as string) as unknown;

  return {
    instantiate: (spec, seed, scaffold) =>
      call('instantiate_json', { spec, seed, scaffold }) as InstantiateResult,
    grade: (payload, code) => call('grade_json', { payload, code }) as GradeResult,
  };
}
