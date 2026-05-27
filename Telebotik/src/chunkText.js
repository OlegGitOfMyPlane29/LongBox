/**
 * Разбивает длинный текст на перекрывающиеся фрагменты для индексации RAG.
 *
 * @param {string} text
 * @param {{ maxChars?: number, overlap?: number }} [opts]
 * @returns {string[]}
 */
export function chunkText(text, opts = {}) {
  const maxChars = opts.maxChars ?? 1400;
  const overlap = opts.overlap ?? 180;

  const normalized = text.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  if (!normalized) return [];

  /** @type {string[]} */
  const chunks = [];
  let pos = 0;

  while (pos < normalized.length) {
    let end = Math.min(pos + maxChars, normalized.length);

    if (end < normalized.length) {
      const piece = normalized.slice(pos, end);
      const breakAt = Math.max(
        piece.lastIndexOf('\n\n'),
        piece.lastIndexOf('. '),
        piece.lastIndexOf('\n'),
      );
      if (breakAt > maxChars * 0.45) {
        end = pos + breakAt + 1;
      }
    }

    const chunk = normalized.slice(pos, end).trim();
    if (chunk.length >= 40) {
      chunks.push(chunk);
    }

    if (end >= normalized.length) break;
    pos = Math.max(end - overlap, pos + 1);
  }

  return chunks;
}
