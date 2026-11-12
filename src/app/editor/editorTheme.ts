import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { EditorView } from '@codemirror/view';
import { tags as t } from '@lezer/highlight';

/* Colors come from CSS variables in global.css, so light and dark mode need no JS. */

const highlight = HighlightStyle.define([
  {
    tag: [t.keyword, t.controlKeyword, t.definitionKeyword, t.moduleKeyword],
    color: 'var(--syn-keyword)',
  },
  { tag: [t.string, t.special(t.string)], color: 'var(--syn-string)' },
  { tag: [t.number, t.integer, t.float], color: 'var(--syn-number)' },
  { tag: [t.bool, t.null, t.self], color: 'var(--syn-constant)' },
  { tag: t.comment, color: 'var(--syn-comment)', fontStyle: 'italic' },
  { tag: [t.function(t.variableName), t.function(t.propertyName)], color: 'var(--syn-function)' },
  { tag: t.definition(t.variableName), color: 'var(--syn-definition)' },
  { tag: [t.className, t.typeName], color: 'var(--syn-type)' },
  { tag: [t.operator, t.punctuation, t.bracket], color: 'var(--syn-operator)' },
]);

const base = EditorView.theme({
  '&': {
    backgroundColor: 'var(--code-bg)',
    color: 'var(--text)',
    fontSize: '15px',
    borderRadius: 'var(--radius-small)',
  },
  '.cm-content': {
    fontFamily: 'var(--font-code)',
    padding: '10px 0',
    caretColor: 'var(--code-cursor)',
  },
  '.cm-scroller': { fontFamily: 'var(--font-code)', lineHeight: '1.75' },
  '.cm-gutters': {
    backgroundColor: 'transparent',
    color: 'var(--code-gutter)',
    border: 'none',
    paddingRight: '6px',
  },
  '.cm-activeLine': { backgroundColor: 'transparent' },
  '.cm-activeLineGutter': { backgroundColor: 'transparent', color: 'var(--text-muted)' },
  '.cm-cursor': { borderLeftColor: 'var(--code-cursor)', borderLeftWidth: '2px' },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection': {
    backgroundColor: 'var(--code-selection) !important',
  },
  '&.cm-focused': { outline: 'none' },
  '.cm-placeholder': { color: 'var(--code-gutter)' },
});

export const editorTheme = [base, syntaxHighlighting(highlight)];
