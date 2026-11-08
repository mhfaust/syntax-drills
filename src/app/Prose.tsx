/** Renders prompt text, turning `backticks` into inline code. Nothing else is interpreted. */
export function Prose({ text }: { text: string }) {
  const parts = text.split(/(`[^`]+`)/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith('`') && part.endsWith('`') && part.length > 1 ?
          <code key={i}>{part.slice(1, -1)}</code>
        : part,
      )}
    </>
  );
}
