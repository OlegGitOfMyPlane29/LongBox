import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

async function applySql(pool, relativePath) {
  const sql = fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
  await pool.query(sql);
}

async function main() {
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) {
    console.error('Укажите DATABASE_URL в .env (см. .env.example).');
    process.exit(1);
  }

  const pool = new Pool({ connectionString });
  try {
    await applySql(pool, path.join('db', 'schema.sql'));
    console.log('OK: db/schema.sql');
    await applySql(pool, path.join('db', 'seed.sql'));
    console.log('OK: db/seed.sql');
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
