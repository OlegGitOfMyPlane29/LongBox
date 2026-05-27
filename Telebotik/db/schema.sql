-- Telebotik RAG: pgvector + фрагменты документов ОЗОН.
-- Требуется расширение pgvector на сервере PostgreSQL.

CREATE EXTENSION IF NOT EXISTS vector;

DROP TABLE IF EXISTS btc_daily_subscribers CASCADE;
DROP TABLE IF EXISTS master_services CASCADE;
DROP TABLE IF EXISTS masters CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS salon CASCADE;

-- Размерность Embeddings GigaChat (модель Embeddings) — 1024.
-- При смене модели embeddings обновите RAG_EMBEDDING_DIM и переиндексируйте.
CREATE TABLE IF NOT EXISTS rag_chunks (
  id BIGSERIAL PRIMARY KEY,
  source_file TEXT NOT NULL,
  chunk_index INT NOT NULL,
  content TEXT NOT NULL,
  embedding vector(1024) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (source_file, chunk_index)
);

CREATE INDEX IF NOT EXISTS ix_rag_chunks_source_file ON rag_chunks (source_file);
