import type { Scaffold } from '@/core/model/content';
import type { PythonTemplateSpec } from '@/languages/python/pythonContent';

export type WorkerRequest = { id: number } & (
  | { type: 'load' }
  | { type: 'instantiate'; spec: PythonTemplateSpec; seed: number; scaffold: Scaffold }
  | { type: 'grade'; payload: unknown; code: string }
);

export type WorkerResponse =
  { id: number; ok: true; result: unknown } | { id: number; ok: false; error: string };
