import type { ItemInstance, ItemTemplate, Scaffold } from '@/core/model/content';
import type { GradeResult, LanguageRuntime } from '@/core/ports/language';
import type { InstantiateResult } from '@/languages/python/harness';
import { PYTHON, type PythonTemplateSpec } from '@/languages/python/pythonContent';
import type { WorkerRequest, WorkerResponse } from '@/languages/python/workerProtocol';

/** Learner code gets this long per submission before the worker is replaced. */
const GRADE_TIMEOUT_MS = 2000;
const INSTANTIATE_TIMEOUT_MS = 10_000;

type Pending = { resolve: (value: unknown) => void; reject: (error: Error) => void };
type Request =
  WorkerRequest extends infer R ?
    R extends { id: number } ?
      Omit<R, 'id'>
    : never
  : never;

class WorkerTimeout extends Error {}

/** Python via Pyodide in a Web Worker. */
export class PythonRuntime implements LanguageRuntime {
  readonly languageId = PYTHON;
  private worker: Worker | null = null;
  private loading: Promise<void> | null = null;
  private nextId = 1;
  private pending = new Map<number, Pending>();

  load(): Promise<void> {
    if (!this.loading) {
      this.worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
      this.worker.onmessage = (event: MessageEvent<WorkerResponse>) => this.receive(event.data);
      /* Pyodide's first load can take a while on a cold cache, so this has no timeout. */
      this.loading = this.send({ type: 'load' }, null).then(() => undefined);
    }
    return this.loading;
  }

  async instantiate(
    template: ItemTemplate,
    seed: number,
    scaffold: Scaffold,
  ): Promise<ItemInstance> {
    await this.load();
    const spec = template.spec as PythonTemplateSpec;
    const result = (await this.send(
      { type: 'instantiate', spec, seed, scaffold },
      INSTANTIATE_TIMEOUT_MS,
    )) as InstantiateResult;
    return { templateId: template.id, seed, ...result };
  }

  async grade(instance: ItemInstance, code: string): Promise<GradeResult> {
    await this.load();
    try {
      return (await this.send(
        { type: 'grade', payload: instance.payload, code },
        GRADE_TIMEOUT_MS,
      )) as GradeResult;
    } catch (error) {
      if (!(error instanceof WorkerTimeout)) throw error;
      this.restart();
      return {
        outcome: 'timeout',
        errorClass: 'py.timeout',
        message: `Your code ran for more than ${GRADE_TIMEOUT_MS / 1000} seconds. Look for a loop that never ends.`,
        idiomFlags: [],
      };
    }
  }

  dispose(): void {
    this.worker?.terminate();
    this.worker = null;
    this.loading = null;
    for (const p of this.pending.values()) p.reject(new Error('Python runtime disposed'));
    this.pending.clear();
  }

  private restart(): void {
    this.dispose();
    void this.load();
  }

  private send(request: Request, timeoutMs: number | null): Promise<unknown> {
    const id = this.nextId++;
    const worker = this.worker;
    if (!worker) return Promise.reject(new Error('Python runtime not loaded'));
    return new Promise((resolve, reject) => {
      const timer =
        timeoutMs === null ? null : (
          setTimeout(() => {
            this.pending.delete(id);
            reject(new WorkerTimeout());
          }, timeoutMs)
        );
      this.pending.set(id, {
        resolve: (value) => {
          if (timer) clearTimeout(timer);
          resolve(value);
        },
        reject: (error) => {
          if (timer) clearTimeout(timer);
          reject(error);
        },
      });
      worker.postMessage({ ...request, id } as WorkerRequest);
    });
  }

  private receive(response: WorkerResponse): void {
    const pending = this.pending.get(response.id);
    if (!pending) return;
    this.pending.delete(response.id);
    if (response.ok) pending.resolve(response.result);
    else pending.reject(new Error(response.error));
  }
}
