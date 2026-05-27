import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import 'dotenv/config';

import { chunkText } from '../src/chunkText.js';
import { loadDocumentsFromDir } from '../src/docExtract.js';
import { createGigachatFromEnv } from '../src/gigachatClient.js';
import {
  deleteChunksForSource,
  insertChunk,
  countChunks,
} from '../src/ragStore.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const docsDir = path.join(repoRoot, 'docs');

const EMBED_BATCH = 8;

async function main() {
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) {
    console.error('Укажите DATABASE_URL в .env');
    process.exit(1);
  }

  const gigachat = createGigachatFromEnv();
  if (!gigachat) {
    console.error('Укажите GIGACHAT_AUTHORIZATION_KEY в .env');
    process.exit(1);
  }

  const documents = await loadDocumentsFromDir(docsDir);
  const pool = new pg.Pool({ connectionString });

  try {
    await pool.query('SELECT 1');
    await pool.query('SELECT id FROM rag_chunks LIMIT 1');
  } catch (err) {
    console.error(
      'Нет таблицы rag_chunks или pgvector. Сначала выполните: npm run db:apply',
    );
    console.error(err?.message ?? err);
    await pool.end();
    process.exit(1);
  }

  let totalChunks = 0;

  for (const doc of documents) {
    console.log(`[rag:index] файл: ${doc.sourceFile} (${doc.text.length} симв.)`);
    const chunks = chunkText(doc.text);
    console.log(`[rag:index] фрагментов: ${chunks.length}`);

    await deleteChunksForSource(pool, doc.sourceFile);

    for (let i = 0; i < chunks.length; i += EMBED_BATCH) {
      const batch = chunks.slice(i, i + EMBED_BATCH);
      const vectors = await gigachat.embedTexts(batch);

      if (i === 0 && vectors[0]?.length) {
        console.log(`[rag:index] размерность embedding: ${vectors[0].length}`);
        if (vectors[0].length !== 1024) {
          console.warn(
            '[rag:index] WARNING: ожидалась размерность 1024 в db/schema.sql — проверьте GIGACHAT_EMBEDDINGS_MODEL',
          );
        }
      }

      for (let j = 0; j < batch.length; j += 1) {
        await insertChunk(pool, {
          sourceFile: doc.sourceFile,
          chunkIndex: i + j,
          content: batch[j],
          embedding: vectors[j],
        });
      }

      process.stdout.write(
        `[rag:index] ${doc.sourceFile}: ${Math.min(i + batch.length, chunks.length)}/${chunks.length}\r`,
      );
    }

    console.log(`\n[rag:index] готово: ${doc.sourceFile}`);
    totalChunks += chunks.length;
  }

  const inDb = await countChunks(pool);
  console.log(`[rag:index] всего фрагментов в БД: ${inDb} (ожидалось ~${totalChunks})`);

  if (!fs.existsSync(docsDir)) {
    console.warn('[rag:index] папка docs отсутствует');
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
