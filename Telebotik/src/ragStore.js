/** @typedef {import('pg').Pool} Pool */

/** @typedef {{ id: number, source_file: string, chunk_index: number, content: string, similarity: number }} RagHit */

/**
 * @param {number[]} embedding
 */
export function vectorToPgLiteral(embedding) {
  return `[${embedding.join(',')}]`;
}

/**
 * @param {Pool} pool
 * @param {string} sourceFile
 */
export async function deleteChunksForSource(pool, sourceFile) {
  await pool.query('DELETE FROM rag_chunks WHERE source_file = $1', [sourceFile]);
}

/**
 * @param {Pool} pool
 * @param {{ sourceFile: string, chunkIndex: number, content: string, embedding: number[] }} row
 */
export async function insertChunk(pool, row) {
  await pool.query(
    `INSERT INTO rag_chunks (source_file, chunk_index, content, embedding)
     VALUES ($1, $2, $3, $4::vector)
     ON CONFLICT (source_file, chunk_index)
     DO UPDATE SET content = EXCLUDED.content, embedding = EXCLUDED.embedding, created_at = now()`,
    [
      row.sourceFile,
      row.chunkIndex,
      row.content,
      vectorToPgLiteral(row.embedding),
    ],
  );
}

/**
 * @param {Pool} pool
 * @returns {Promise<number>}
 */
export async function countChunks(pool) {
  const res = await pool.query('SELECT COUNT(*)::int AS c FROM rag_chunks');
  return res.rows[0]?.c ?? 0;
}

/**
 * @param {Pool} pool
 * @param {number[]} queryEmbedding
 * @param {{ limit?: number, minSimilarity?: number }} [opts]
 * @returns {Promise<RagHit[]>}
 */
export async function searchSimilarChunks(pool, queryEmbedding, opts = {}) {
  const limit = opts.limit ?? 4;
  const minSimilarity = opts.minSimilarity ?? 0.32;
  const vec = vectorToPgLiteral(queryEmbedding);

  const res = await pool.query(
    `SELECT id, source_file, chunk_index, content,
            1 - (embedding <=> $1::vector) AS similarity
     FROM rag_chunks
     ORDER BY embedding <=> $1::vector
     LIMIT $2`,
    [vec, limit],
  );

  return res.rows
    .map((row) => ({
      id: row.id,
      source_file: row.source_file,
      chunk_index: row.chunk_index,
      content: row.content,
      similarity: Number(row.similarity),
    }))
    .filter((row) => row.similarity >= minSimilarity);
}
