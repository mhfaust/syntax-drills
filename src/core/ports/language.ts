import type { ItemInstance, ItemTemplate, Scaffold } from '@/core/model/content';
import type { LanguageId } from '@/core/model/ids';

export type GradeOutcome = 'pass' | 'fail' | 'syntax-error' | 'runtime-error' | 'timeout';

export type GradeResult = {
  outcome: GradeOutcome;
  /** Opaque, language-namespaced label such as 'py.missing-colon'. */
  errorClass?: string;
  /** 1-based line in the learner's code. */
  line?: number;
  message?: string;
  /** Opaque, language-namespaced labels such as 'py.range-len-index'. */
  idiomFlags: string[];
};

/** Everything language-specific: generating exercises from templates and grading code. */
export interface LanguageRuntime {
  readonly languageId: LanguageId;
  load(): Promise<void>;
  instantiate(template: ItemTemplate, seed: number, scaffold: Scaffold): Promise<ItemInstance>;
  grade(instance: ItemInstance, code: string): Promise<GradeResult>;
  dispose(): void;
}
