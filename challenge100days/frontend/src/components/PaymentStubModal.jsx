import { useState } from 'react'
import { X } from 'lucide-react'

const BOT_URL = import.meta.env.VITE_TELEGRAM_BOT_URL || 'https://t.me/telebotik200526_bot'

export default function PaymentStubModal({ open, onClose }) {
  const [submitted, setSubmitted] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', telegram: '' })

  if (!open) return null

  const handleSubmit = (event) => {
    event.preventDefault()
    setSubmitted(true)
  }

  const handleClose = () => {
    setSubmitted(false)
    setForm({ name: '', email: '', telegram: '' })
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="payment-modal-title"
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="absolute right-4 top-4 rounded-lg p-1 text-slate-500 hover:bg-slate-100"
          onClick={handleClose}
          aria-label="Закрыть"
        >
          <X size={20} />
        </button>

        {submitted ? (
          <div className="space-y-4 pt-2">
            <h2 id="payment-modal-title" className="text-xl font-bold text-slate-900">
              Заявка принята
            </h2>
            <p className="text-slate-600 leading-relaxed">
              Спасибо! Оплата пока недоступна — это учебный проект. Мы сохранили ваши данные для
              демонстрации. Пока можете протестировать бота бесплатно в Telegram.
            </p>
            <a
              href={BOT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full items-center justify-center rounded-xl bg-[#0088cc] px-4 py-3 font-semibold text-white transition hover:bg-[#0077b3]"
            >
              Открыть @telebotik200526_bot
            </a>
            <button
              type="button"
              className="w-full rounded-xl border border-slate-200 px-4 py-2 text-slate-600 hover:bg-slate-50"
              onClick={handleClose}
            >
              Закрыть
            </button>
          </div>
        ) : (
          <>
            <h2 id="payment-modal-title" className="mb-1 text-xl font-bold text-slate-900">
              Подключить Telebotik
            </h2>
            <p className="mb-5 text-sm text-slate-500">
              1 000 ₽/мес · форма оплаты-заглушка для учебного проекта
            </p>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">Имя</span>
                <input
                  required
                  type="text"
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-[#0088cc] focus:ring-2 focus:ring-[#0088cc]/20"
                  placeholder="Андрей"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">Email</span>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm({ ...form, email: event.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-[#0088cc] focus:ring-2 focus:ring-[#0088cc]/20"
                  placeholder="seller@mail.ru"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">Telegram</span>
                <input
                  required
                  type="text"
                  value={form.telegram}
                  onChange={(event) => setForm({ ...form, telegram: event.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-[#0088cc] focus:ring-2 focus:ring-[#0088cc]/20"
                  placeholder="@username"
                />
              </label>
              <button
                type="submit"
                className="w-full rounded-xl bg-[#005bff] px-4 py-3 font-semibold text-white transition hover:bg-[#004fe0]"
              >
                Оформить подписку — 1 000 ₽/мес
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
