import { Fragment, type ReactNode } from 'react';
import { CodeEditor } from '@/app/editor/CodeEditor';
import { parseMarkdown } from '@/app/reference/parseMarkdown';
import styles from '@/app/reference/reference.module.css';
import type { LanguageId } from '@/core/model/ids';

/** Renders an overview card. Code blocks get the same highlighting as the drill editor. */
export function Markdown({ source, languageId }: { source: string; languageId: LanguageId }) {
  return (
    <div className={styles.markdown}>
      {parseMarkdown(source).map((block, i) => {
        switch (block.kind) {
          case 'heading': {
            const Heading = `h${Math.max(block.level, 2)}` as 'h2';
            return <Heading key={i}>{inline(block.text)}</Heading>;
          }
          case 'paragraph':
            return <p key={i}>{inline(block.text)}</p>;
          case 'list': {
            const List = block.ordered ? 'ol' : 'ul';
            return (
              <List key={i}>
                {block.items.map((item, j) => (
                  <li key={j}>{inline(item)}</li>
                ))}
              </List>
            );
          }
          case 'code':
            return (
              <div
                key={i}
                className={styles.code}
              >
                <CodeEditor
                  languageId={languageId}
                  initialCode={block.code}
                  readOnly
                />
              </div>
            );
        }
      })}
    </div>
  );
}

/** `code` and **bold**; everything else is plain text. */
function inline(text: string): ReactNode {
  return text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('`') && part.endsWith('`') && part.length > 1 ?
      <code key={i}>{part.slice(1, -1)}</code>
    : part.startsWith('**') && part.endsWith('**') && part.length > 4 ?
      <strong key={i}>{part.slice(2, -2)}</strong>
    : <Fragment key={i}>{part}</Fragment>,
  );
}
