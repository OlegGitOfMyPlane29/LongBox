import { LogOut, Pickaxe, ScrollText, UserCircle2 } from 'lucide-react'
import { Link, NavLink } from 'react-router-dom'

import { useAuth } from '../context/AuthContext'
import Button from './Button'

const navClassName = ({ isActive }) =>
  `border-4 border-black px-3 py-2 text-sm font-bold uppercase ${
    isActive ? 'bg-block-accent' : 'bg-block-muted'
  }`

export default function Layout({ children }) {
  const { user, logout } = useAuth()

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-4 bg-block-bg p-4">
      <header className="border-4 border-black bg-block-panel p-4 shadow-block">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <Link to="/" className="flex items-center gap-2 text-xl font-black uppercase">
            <Pickaxe size={20} />
            challenge100days
          </Link>
          <div className="text-sm">
            Игрок: <span className="font-bold">{user?.display_name || 'Гость'}</span>
          </div>
        </div>
        <nav className="flex flex-wrap items-center gap-2">
          <NavLink to="/" className={navClassName}>
            Дашборд
          </NavLink>
          <NavLink to="/feed" className={navClassName}>
            Лента
          </NavLink>
          <NavLink to="/profile" className={navClassName}>
            Профиль
          </NavLink>
          <Button variant="danger" className="ml-auto flex items-center gap-2" onClick={logout}>
            <LogOut size={16} />
            Выйти
          </Button>
          <span className="inline-flex items-center gap-1 rounded-none border-4 border-black bg-block-muted px-2 py-1 text-xs uppercase">
            <UserCircle2 size={14} />
            {user?.role === 'admin' ? 'Админ' : 'Игрок'}
          </span>
          <span className="inline-flex items-center gap-1 rounded-none border-4 border-black bg-block-muted px-2 py-1 text-xs uppercase">
            <ScrollText size={14} />
            Русский UI
          </span>
        </nav>
      </header>
      <main className="grid gap-4">{children}</main>
    </div>
  )
}
