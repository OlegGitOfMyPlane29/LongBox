const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

function formatDetail(detail) {
  if (detail == null) return "Ошибка запроса";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail.map((d) => (typeof d === "string" ? d : d.msg || JSON.stringify(d))).join("; ");
  }
  if (typeof detail === "object" && detail.detail) return formatDetail(detail.detail);
  return JSON.stringify(detail);
}

export async function apiFetch(path, options = {}) {
  const token = localStorage.getItem("token");
  const headers = { ...(options.headers || {}) };
  const hasBody = options.body !== undefined && options.body !== null;
  if (hasBody && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE.replace(/\/$/, "")}${path}`, {
    ...options,
    headers,
  });

  const text = await res.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { detail: text };
    }
  }

  if (!res.ok) {
    throw new Error(formatDetail(data?.detail ?? data ?? res.statusText));
  }

  return data;
}

export { API_BASE };
