import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import PixelButton from "../components/PixelButton.jsx";
import { apiFetch } from "../services/api.js";

function cupLabel(cup) {
  if (cup === "golden") return "Золото";
  if (cup === "copper") return "Медь";
  return "—";
}

function statusLabel(s) {
  if (s === "completed") return "Завершено";
  return "В процессе";
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const data = await apiFetch("/challenges");
        setItems(data);
      } catch (e) {
        setError(e.message);
      }
    })();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-pixel text-xs text-slate-900">Мои испытания</h1>
        <PixelButton onClick={() => navigate("/challenges/new")}>Новое испытание</PixelButton>
      </div>
      {error && <p className="font-mono text-sm text-rose-700">{error}</p>}
      <ul className="space-y-3">
        {items.map((c) => (
          <li key={c.id} className="border-4 border-slate-900 bg-white p-4 shadow-pixel-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <Link className="font-pixel text-[10px] text-sky-900 hover:underline sm:text-[11px]" to={`/challenges/${c.id}`}>
                  {c.title}
                </Link>
                <p className="mt-1 font-mono text-xs text-slate-600">
                  {statusLabel(c.status)} · дней отмечено: {c.days_logged} · кубок: {cupLabel(c.cup)}
                </p>
              </div>
              <PixelButton variant="neutral" className="py-2 text-[9px]" onClick={() => navigate(`/challenges/${c.id}`)}>
                Открыть
              </PixelButton>
            </div>
          </li>
        ))}
      </ul>
      {!items.length && !error && (
        <p className="font-mono text-sm text-slate-600">Пока нет испытаний — нажмите «Новое испытание» или «ПОЕХАЛИ» на главной.</p>
      )}
    </div>
  );
}
