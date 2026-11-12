import { describe, expect, it } from 'vitest';
import { parseMarkdown } from '@/app/reference/parseMarkdown';

describe('parseMarkdown', () => {
  it('splits headings, paragraphs, lists and code blocks', () => {
    const source = [
      'A short intro',
      'over two lines.',
      '',
      '## Forms',
      '',
      '```python form',
      'for x in xs:',
      '',
      '    body',
      '```',
      '',
      '- one',
      '  continued',
      '- two',
      '1. first',
    ].join('\n');

    expect(parseMarkdown(source)).toEqual([
      { kind: 'paragraph', text: 'A short intro over two lines.' },
      { kind: 'heading', level: 2, text: 'Forms' },
      { kind: 'code', info: 'python form', code: 'for x in xs:\n\n    body' },
      { kind: 'list', ordered: false, items: ['one continued', 'two'] },
      { kind: 'list', ordered: true, items: ['first'] },
    ]);
  });
});
