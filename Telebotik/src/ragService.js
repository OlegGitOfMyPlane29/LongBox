import { searchSimilarChunks } from './ragStore.js';

/** @typedef {import('./gigachatClient.js').GigachatClient} GigachatClient */
/** @typedef {import('pg').Pool} Pool */
/** @typedef {import('./ragStore.js').RagHit} RagHit */

export const RAG_NO_KNOWLEDGE =
  'В загруженных документах ОЗОН нет подходящей информации по этому вопросу. ' +
  'Попробуйте переформулировать (например, добавьте «возврат», «заказ», «продажа на ОЗОН») ' +
  'или обратитесь в поддержку ОЗОН / docs.ozon.ru.';

/**
 * @param {RagHit[]} hits
 * @param {string} query
 */
export function logRagHits(query, hits) {
  console.log('[rag] запрос:', query.slice(0, 200));
  if (hits.length === 0) {
    console.log('[rag] фрагменты: (не найдено)');
    return;
  }
  for (const h of hits) {
    const preview = h.content.replace(/\s+/g, ' ').slice(0, 120);
    console.log(
      `[rag] hit id=${h.id} file=${h.source_file} chunk=${h.chunk_index} sim=${h.similarity.toFixed(3)} | ${preview}…`,
    );
  }
}

/**
 * @param {RagHit[]} hits
 */
export function formatRagContext(hits) {
  return hits
    .map(
      (h, i) =>
        `[Фрагмент ${i + 1} | ${h.source_file} #${h.chunk_index} | similarity=${h.similarity.toFixed(3)}]\n${h.content}`,
    )
    .join('\n\n---\n\n');
}

/**
 * @param {Pool} pool
 * @param {GigachatClient} gigachat
 * @param {{ topK?: number, minSimilarity?: number }} [opts]
 */
export function createRagService(pool, gigachat, opts = {}) {
  const topK = opts.topK ?? 4;
  const minSimilarity = opts.minSimilarity ?? 0.32;

  return {
    /**
     * @param {string} query
     * @returns {Promise<{ hits: RagHit[], context: string | null }>}
     */
    async retrieve(query) {
      const trimmed = query.trim();
      const [embedding] = await gigachat.embedTexts([trimmed]);
      const hits = await searchSimilarChunks(pool, embedding, {
        limit: topK,
        minSimilarity,
      });
      logRagHits(trimmed, hits);
      if (hits.length === 0) {
        return { hits: [], context: null };
      }
      return { hits, context: formatRagContext(hits) };
    },
  };
}

/**
 * @param {typeof process.env} [env]
 */
export function ragOptionsFromEnv(env = process.env) {
  const topK = Number(env.RAG_TOP_K ?? 4);
  const minSimilarity = Number(env.RAG_MIN_SIMILARITY ?? 0.32);
  return {
    topK: Number.isFinite(topK) && topK > 0 ? topK : 4,
    minSimilarity:
      Number.isFinite(minSimilarity) && minSimilarity >= 0 ? minSimilarity : 0.32,
  };
}
