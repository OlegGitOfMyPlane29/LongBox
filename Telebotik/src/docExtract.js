import fs from 'node:fs';
import path from 'node:path';
import mammoth from 'mammoth';

/**
 * @param {string} filePath
 * @returns {Promise<string>}
 */
export async function extractTextFromFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === '.docx') {
    const buffer = fs.readFileSync(filePath);
    const result = await mammoth.extractRawText({ buffer });
    return result.value.replace(/\r\n/g, '\n').trim();
  }

  if (ext === '.txt' || ext === '.md') {
    return fs.readFileSync(filePath, 'utf8').trim();
  }

  throw new Error(
    `[docExtract] Неподдерживаемый формат ${ext} (${filePath}). Используйте .docx, .txt или .md.`,
  );
}

/**
 * @param {string} docsDir
 * @returns {Promise<{ filePath: string, sourceFile: string, text: string }[]>}
 */
export async function loadDocumentsFromDir(docsDir) {
  if (!fs.existsSync(docsDir)) {
    throw new Error(`[docExtract] Папка не найдена: ${docsDir}`);
  }

  const names = fs
    .readdirSync(docsDir)
    .filter((n) => /\.(docx|txt|md)$/i.test(n))
    .sort();

  if (names.length === 0) {
    throw new Error(`[docExtract] В ${docsDir} нет .docx/.txt/.md файлов`);
  }

  /** @type {{ filePath: string, sourceFile: string, text: string }[]} */
  const out = [];

  for (const name of names) {
    const filePath = path.join(docsDir, name);
    const text = await extractTextFromFile(filePath);
    if (!text) {
      console.warn(`[docExtract] Пустой файл, пропуск: ${name}`);
      continue;
    }
    out.push({ filePath, sourceFile: name, text });
  }

  return out;
}
