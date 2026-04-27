import { Outlet, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen text-slate-900">
      <header className="border-b-4 border-slate-900 bg-lime-300">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Link to="/" className="font-pixel text-[10px] uppercase tracking-tight text-slate-900 sm:text-xs">
            challenge20days
          </Link>
          <nav className="flex flex-wrap items-center gap-2 font-mono text-xs">
            <Link className="border-2 border-slate-900 bg-amber-50 px-2 py-1 shadow-pixel-sm" to="/feed">
              Лента
            </Link>
            {user ? (
              <>
                <Link className="border-2 border-slate-900 bg-amber-50 px-2 py-1 shadow-pixel-sm" to="/dashboard">
                  Мои испытания
                </Link>
                <button
                  type="button"
                  className="border-2 border-slate-900 bg-white px-2 py-1 shadow-pixel-sm"
                  onClick={() => {
                    logout();
                    navigate("/");
                  }}
                >
                  Выход
                </button>
              </>
            ) : (
              <>
                <Link className="border-2 border-slate-900 bg-amber-50 px-2 py-1 shadow-pixel-sm" to="/login">
                  Вход
                </Link>
                <Link className="border-2 border-slate-900 bg-amber-50 px-2 py-1 shadow-pixel-sm" to="/register">
                  Регистрация
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">
        <Outlet />
      </main>
      <footer className="border-t-4 border-slate-900 bg-stone-300 py-4 text-center font-mono text-[10px] text-slate-700">
        20 дней · до 3 привычек · золото или медь
      </footer>
    </div>
  );
}
