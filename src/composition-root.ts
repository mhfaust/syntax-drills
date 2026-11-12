/*
 * The one place where implementations are chosen and wired to ports. Swapping storage
 * for a cloud API, local identity for OAuth, or adding a language happens here.
 */
import { LocalIdentity } from '@/adapters/identity/LocalIdentity';
import { IndexedDbAttemptStore } from '@/adapters/storage/indexeddb/IndexedDbAttemptStore';
import type { AppServices } from '@/app/services';
import { createEngine } from '@/core/engine/engine';
import { createEventBus } from '@/core/events';
import { systemClock } from '@/core/ports/clock';
import { loadPythonPack } from '@/languages/python/pythonContent';
import { PythonRuntime } from '@/languages/python/PythonRuntime';

const pythonFiles = import.meta.glob<string>(
  ['/content/python/core/**/*.yaml', '/content/python/core/overviews/*.md'],
  {
    query: '?raw',
    import: 'default',
    eager: true,
  },
);

export async function createServices(): Promise<AppServices> {
  const content = loadPythonPack(
    Object.entries(pythonFiles).map(([path, text]) => ({ path, text })),
  );
  const runtime = new PythonRuntime();
  /* Start Pyodide downloading right away; the first exercise needs it. */
  void runtime.load();

  return {
    learner: await new LocalIdentity().current(),
    content,
    engine: await createEngine(content),
    runtime,
    attempts: new IndexedDbAttemptStore(),
    events: createEventBus(),
    clock: systemClock,
  };
}
