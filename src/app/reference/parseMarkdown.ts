/*
 * The small Markdown subset that skill overviews use: headings, paragraphs, bullet and
 * numbered lists, and fenced code blocks. Inline formatting (`code`, **bold**) is left in
 * the text for the renderer. Shared by the reference screen and the content validator, so
 * both agree on what counts as a code block.
 */

export type MarkdownBlock =
  | { kind: 'heading'; level: number; text: string }
  | { kind: 'paragraph'; text: string }
  | { kind: 'list'; ordered: boolean; items: string[] }
  /** `info` is everything after the opening fence, e.g. 'python' or 'python form'. */
  | { kind: 'code'; info: string; code: string };

const FENCE = /^```(.*)$/;
const HEADING = /^(#{1,6})\s+(.*)$/;
const BULLET = /^[-*]\s+(.*)$/;
const NUMBERED = /^\d+[.)]\s+(.*)$/;

export function parseMarkdown(source: string): MarkdownBlock[] {
  const lines = source.replace(/\r\n?/g, '\n').split('\n');
  const blocks: MarkdownBlock[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i]!;
    const fence = FENCE.exec(line);
    const heading = HEADING.exec(line);

    if (line.trim() === '') {
      i += 1;
    } else if (fence) {
      const body: string[] = [];
      i += 1;
      while (i < lines.length && !lines[i]!.startsWith('```')) body.push(lines[i++]!);
      i += 1;
      blocks.push({ kind: 'code', info: fence[1]!.trim(), code: body.join('\n') });
    } else if (heading) {
      blocks.push({ kind: 'heading', level: heading[1]!.length, text: heading[2]!.trim() });
      i += 1;
    } else if (BULLET.test(line) || NUMBERED.test(line)) {
      const ordered = NUMBERED.test(line);
      const marker = ordered ? NUMBERED : BULLET;
      const items: string[] = [];
      while (i < lines.length && lines[i]!.trim() !== '') {
        const item = marker.exec(lines[i]!);
        if (item) items.push(item[1]!.trim());
        else if (items.length > 0 && /^\s/.test(lines[i]!)) {
          /* An indented line continues the previous item. */
          items[items.length - 1] += ` ${lines[i]!.trim()}`;
        } else break;
        i += 1;
      }
      blocks.push({ kind: 'list', ordered, items });
    } else {
      const text: string[] = [];
      while (
        i < lines.length &&
        lines[i]!.trim() !== '' &&
        !FENCE.test(lines[i]!) &&
        !HEADING.test(lines[i]!) &&
        !BULLET.test(lines[i]!) &&
        !NUMBERED.test(lines[i]!)
      ) {
        text.push(lines[i++]!.trim());
      }
      blocks.push({ kind: 'paragraph', text: text.join(' ') });
    }
  }
  return blocks;
}
