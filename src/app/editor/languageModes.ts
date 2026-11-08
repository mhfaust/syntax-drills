import { python } from '@codemirror/lang-python';
import type { Extension } from '@codemirror/state';
import type { LanguageId } from '@/core/model/ids';

/* Editor syntax modes by language. Adding a language adds a line here. */
const modes: Record<LanguageId, () => Extension> = {
  python: () => python(),
};

export function languageMode(languageId: LanguageId): Extension {
  return modes[languageId]?.() ?? [];
}
