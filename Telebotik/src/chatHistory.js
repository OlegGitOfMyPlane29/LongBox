/** @typedef {{ role: 'user' | 'assistant', content: string }} ChatMessage */

/** Сколько последних реплик (user + assistant) хранить в памяти процесса. */
export const MAX_HISTORY_MESSAGES = 10;

/** @type {Map<number, ChatMessage[]>} */
const store = new Map();

/**
 * @param {number} chatId
 * @returns {ChatMessage[]}
 */
export function getHistory(chatId) {
  return store.get(chatId) ?? [];
}

/**
 * @param {number} chatId
 * @param {string} userContent
 * @param {string} assistantContent
 */
export function appendTurn(chatId, userContent, assistantContent) {
  const history = [...(store.get(chatId) ?? [])];
  history.push({ role: 'user', content: userContent });
  history.push({ role: 'assistant', content: assistantContent });
  while (history.length > MAX_HISTORY_MESSAGES) {
    history.shift();
  }
  store.set(chatId, history);
}

/** @param {number} chatId */
export function clearHistory(chatId) {
  store.delete(chatId);
}
