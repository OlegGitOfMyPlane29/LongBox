import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import PixelButton from "../components/PixelButton.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { apiFetch } from "../services/api.js";

export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [quote, setQuote] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const q = await apiFetch("/quotes/random");
        setQuote(q);
      } catch {
        setQuote(null);
      }
    })();
  }, []);

  return (
    <div className="space-y-10">
      {quote && (
        <blockquote className="border-4 border-slate-900 bg-white p-4 font-mono text-xs text-slate-800 shadow-pixel-sm">
          <p>{quote.text}</p>
          {quote.author && <footer className="mt-2 text-[10px] text-slate-500">— {quote.author}</footer>}
        </blockquote>
      )}
      <section className="pixel-panel p-6 sm:p-10">
        <p className="mb-4 font-pixel text-[10px] leading-loose text-sky-900 sm:text-xs">
          20 дней. До трёх привычек. Каждый день — успех или провал.
        </p>
        <p className="mb-6 max-w-2xl font-mono text-sm text-slate-800">
          20 успешных дней подряд — золотой кубок. Любой провал — медный кубок. Ведите комментарии к дням, делитесь
          прогрессом в общей ленте.
        </p>
        <div className="flex flex-wrap gap-4">
          <PixelButton
            className="min-w-[220px] text-[11px] sm:min-w-[260px] sm:px-8 sm:py-4 sm:text-xs"
            onClick={() => navigate(user ? "/challenges/new" : "/register")}
          >
            ПОЕХАЛИ
          </PixelButton>
          {!user && (
            <PixelButton variant="neutral" className="min-w-[160px]" onClick={() => navigate("/login")}>
              Уже есть аккаунт
            </PixelButton>
          )}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          ["Шаг 1", "Создайте испытание и добавьте 1–3 привычки."],
          ["Шаг 2", "Отмечайте каждый из 20 дней: успех или провал."],
          ["Шаг 3", "Опишите итог на 20-й день при победной серии."],
        ].map(([t, d]) => (
          <div key={t} className="border-4 border-slate-900 bg-white p-4 shadow-pixel-sm">
            <h3 className="mb-2 font-pixel text-[10px] text-lime-900">{t}</h3>
            <p className="font-mono text-xs text-slate-700">{d}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
