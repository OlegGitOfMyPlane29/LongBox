const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

const parseResponse = async (response) => {
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.detail || 'Ошибка сервера')
  }
  return data
}

export const apiRequest = async (path, options = {}, token) => {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${API_URL}${path}`, { ...options, headers })
  return parseResponse(response)
}

export { API_URL }
