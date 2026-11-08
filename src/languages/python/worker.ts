import type { PyodideAPI } from 'pyodide';
import { installHarness, type Harness } from '@/languages/python/harness';
import drillErrors from '@/languages/python/harness/drill_errors.py?raw';
import drillGen from '@/languages/python/harness/drill_gen.py?raw';
import drillHarness from '@/languages/python/harness/drill_harness.py?raw';
import drillIdioms from '@/languages/python/harness/drill_idioms.py?raw';
import type { WorkerRequest, WorkerResponse } from '@/languages/python/workerProtocol';

/*
 * Runs Pyodide off the main thread. The main thread kills and replaces this worker when
 * learner code runs too long, which is the only reliable way to stop an infinite loop.
 */

/* The DOM lib types `self` as Window; inside a worker it behaves like this. */
const scope = self as unknown as Worker;

/* Served by the serve-pyodide plugin in vite.config.ts; loaded outside the bundler. */
const PYODIDE_URL = '/pyodide/';

const ready: Promise<Harness> = (async () => {
  const { loadPyodide } = (await import(/* @vite-ignore */ `${PYODIDE_URL}pyodide.mjs`)) as {
    loadPyodide: (options: { indexURL: string }) => Promise<PyodideAPI>;
  };
  const pyodide = await loadPyodide({ indexURL: PYODIDE_URL });
  return installHarness(pyodide, {
    drill_gen: drillGen,
    drill_errors: drillErrors,
    drill_idioms: drillIdioms,
    drill_harness: drillHarness,
  });
})();

scope.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const request = event.data;
  let response: WorkerResponse;
  try {
    const harness = await ready;
    const result =
      request.type === 'load' ? null
      : request.type === 'instantiate' ?
        harness.instantiate(request.spec, request.seed, request.scaffold)
      : harness.grade(request.payload, request.code);
    response = { id: request.id, ok: true, result };
  } catch (error) {
    response = { id: request.id, ok: false, error: String(error) };
  }
  scope.postMessage(response);
};
