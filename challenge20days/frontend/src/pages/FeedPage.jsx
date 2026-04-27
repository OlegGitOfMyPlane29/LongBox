import { useEffect, useState } from "react";
import { apiFetch } from "../services/api.js";

function cupRu(c) {
  if (c === "golden") return "золото";
  if (c === "copper") return "медь";
  return "—";
}

export default function FeedPage() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const data = await apiFetch("/feed");
        setItems(data);
      } catch (e) {
        setError(e.message);
      }
    })();
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="font-pixel text-xs text-slate-900">Общая лента</h1>
      {error && <p className="font-mono text-sm text-rose-700">{error}</p>}
      <ul className="space-y-3">
        {items.map((row) => (
          <li key={row.id} className="border-4 border-slate-900 bg-white p-4 shadow-pixel-sm">
            <p className="font-pixel text-[10px] text-sky-900">{row.title}</p>
            <p className="mt-1 font-mono text-xs text-slate-700">
              @{row.username} · {row.status === "completed" ? "завершено" : "в процессе"} · кубок: {cupRu(row.cup)} ·
              дней: {row.days_logged}
            </p>
          </li>
        ))}
      </ul>
      {!items.length && !error && <p className="font-mono text-sm text-slate-600">Лента пуста.</p>}
    </div>
  );
}
