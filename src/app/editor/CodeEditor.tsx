import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { indentOnInput, indentUnit } from '@codemirror/language';
import { EditorSelection, EditorState, Prec } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, placeholder } from '@codemirror/view';
import { useEffect, useRef } from 'react';
import { editorTheme } from '@/app/editor/editorTheme';
import { languageMode } from '@/app/editor/languageModes';
import type { LanguageId } from '@/core/model/ids';

/** Keys that count as typing for telemetry; modifier-only presses don't. */
const TYPING_KEY = /^(.|Enter|Tab|Backspace|Delete)$/u;

type Props = {
  languageId: LanguageId;
  /** Initial contents. The editor is uncontrolled: remount (change `key`) to reset it. */
  initialCode: string;
  /** Text marking blanks; the first one is selected on mount so typing replaces it. */
  blank?: string;
  placeholderText?: string;
  readOnly?: boolean;
  onChange?(code: string): void;
  onKey?(key: string): void;
  onSubmit?(code: string): void;
};

/*
 * A deliberately bare editor: auto-indent on, but no autocomplete and no auto-closing
 * brackets, so every character is typed by hand.
 */
export function CodeEditor({
  languageId,
  initialCode,
  blank,
  placeholderText,
  readOnly = false,
  onChange,
  onKey,
  onSubmit,
}: Props) {
  const host = useRef<HTMLDivElement>(null);
  const callbacks = useRef({ onChange, onKey, onSubmit });
  callbacks.current = { onChange, onKey, onSubmit };

  useEffect(() => {
    const firstBlank = blank ? initialCode.indexOf(blank) : -1;
    const view = new EditorView({
      parent: host.current!,
      state: EditorState.create({
        doc: initialCode,
        selection:
          firstBlank >= 0 ?
            EditorSelection.single(firstBlank, firstBlank + blank!.length)
          : EditorSelection.cursor(initialCode.length),
        extensions: [
          languageMode(languageId),
          editorTheme,
          indentUnit.of('    '),
          EditorState.tabSize.of(4),
          readOnly ?
            [EditorState.readOnly.of(true), EditorView.editable.of(false)]
          : [
              lineNumbers(),
              history(),
              indentOnInput(),
              Prec.highest(
                keymap.of([
                  {
                    key: 'Mod-Enter',
                    run: (v) => {
                      callbacks.current.onSubmit?.(v.state.doc.toString());
                      return true;
                    },
                  },
                ]),
              ),
              keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
              placeholderText ? placeholder(placeholderText) : [],
              EditorView.domEventHandlers({
                keydown: (event) => {
                  if (!event.metaKey && !event.ctrlKey && TYPING_KEY.test(event.key)) {
                    callbacks.current.onKey?.(event.key);
                  }
                },
              }),
              EditorView.updateListener.of((update) => {
                if (update.docChanged) callbacks.current.onChange?.(update.state.doc.toString());
              }),
            ],
        ],
      }),
    });
    if (!readOnly) view.focus();
    return () => view.destroy();
  }, [languageId, initialCode, blank, placeholderText, readOnly]);

  return <div ref={host} />;
}
