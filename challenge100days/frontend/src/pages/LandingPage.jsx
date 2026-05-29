import {
  BookOpen,
  Bot,
  CheckCircle2,
  ChevronDown,
  Clock,
  MessageCircle,
  Shield,
  Zap,
} from 'lucide-react'
import { createElement, useEffect, useState } from 'react'

import PaymentStubModal from '../components/PaymentStubModal'

const BOT_URL = import.meta.env.VITE_TELEGRAM_BOT_URL || 'https://t.me/telebotik200526_bot'
const PRICE = '1 000'

const benefits = [
  {
    icon: BookOpen,
    feature: 'RAG по документам Ozon',
    gain: 'Ответы опираются на загруженные правила, а не на «догадки» нейросети',
  },
  {
    icon: Zap,
    feature: 'GigaChat + быстрые кнопки',
    gain: 'Темы «Продажа», «Возврат», «Документы» — без долгого поиска в docs.ozon.ru',
  },
  {
    icon: Shield,
    feature: 'Честный fallback',
    gain: 'Если ответа нет в базе — бот скажет прямо и подскажет официальные источники',
  },
  {
    icon: MessageCircle,
    feature: 'Telegram 24/7',
    gain: 'Покупатели и команда получают подсказки там, где уже сидят — в мессенджере',
  },
]

const steps = [
  {
    n: '1',
    title: 'Откройте бота в Telegram',
    text: 'Найдите @telebotik200526_bot и нажмите «Старт» — настройка занимает меньше минуты.',
    time: '30 секунд',
  },
  {
    n: '2',
    title: 'Задайте вопрос или выберите тему',
    text: 'Напишите текстом или нажмите кнопку: продажа, возврат, документы Ozon.',
    time: '10 секунд',
  },
  {
    n: '3',
    title: 'Получите ответ из базы знаний',
    text: 'Бот найдёт фрагменты в документах и сформулирует ответ — как в примерах ниже.',
    time: '15–30 секунд',
  },
]

const reviews = [
  {
    name: 'Андрей К.',
    role: 'продавец электроники, FBS',
    text: 'Раньше каждый вопрос про возврат — полчаса в документах. Telebotik отвечает за минуту и ссылается на правила Ozon. Покупателям проще, мне — меньше рутины.',
  },
  {
    name: 'Марина Л.',
    role: 'магазин косметики на Ozon',
    text: 'Подключила для команды: новички не лезут в docs.ozon.ru с нуля. Кнопки «Возврат» и «Документы» закрывают 80% типовых вопросов.',
  },
  {
    name: 'Игорь В.',
    role: 'FBO, категория «Дом и сад»',
    text: 'Ценю, что бот не выдумывает. Нет фрагмента в базе — честно пишет и направляет в поддержку. Для продавца это важнее красивых, но ложных ответов.',
  },
]

const faq = [
  {
    q: 'Telebotik — это официальная поддержка Ozon?',
    a: 'Нет. Это неофициальный AI-помощник. Ответы строятся на загруженных документах Ozon (RAG), но для юридически значимых решений всегда сверяйтесь с официальными источниками.',
  },
  {
    q: 'Что если в базе нет ответа на мой вопрос?',
    a: 'Бот сообщит об этом и предложит официальные документы на docs.ozon.ru или обращение в поддержку Ozon — без выдуманных формулировок.',
  },
  {
    q: 'Подойдёт ли мне, если я только начинаю продавать?',
    a: 'Да. Бот заточен под продавцов: продажа на маркетплейсе, возвраты, правила площадки, документы. Можно задавать вопросы простым языком.',
  },
  {
    q: 'Нужно ли устанавливать отдельное приложение?',
    a: 'Нет. Всё работает в Telegram — на телефоне и на компьютере.',
  },
  {
    q: 'Как работает оплата 1 000 ₽/мес?',
    a: 'Сейчас это учебный проект: на сайте форма-заглушка для демонстрации. Реальная оплата не подключена — можно бесплатно протестировать бота в Telegram.',
  },
  {
    q: 'Можно ли задавать вопросы не про Ozon?',
    a: 'Нет. Бот отвечает только по темам маркетплейса Ozon и вежливо отказывает на посторонние запросы.',
  },
]

const demoScreens = [
  { src: '/landing/return-how.png', alt: 'Ответ бота про оформление возврата' },
  { src: '/landing/refund-money.png', alt: 'Ответ про возврат денег при отмене заказа' },
  { src: '/landing/rag-answer.png', alt: 'Ответ по документам с пометкой фрагмента RAG' },
  { src: '/landing/no-answer.png', alt: 'Честный ответ когда нет данных в базе' },
]

function BenefitCard({ icon, feature, gain }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-[#005bff]">
        {createElement(icon, { size: 22 })}
      </div>
      <h3 className="mb-2 font-bold">{feature}</h3>
      <p className="text-slate-600 leading-relaxed">{gain}</p>
    </div>
  )
}

function FaqItem({ question, answer }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-semibold text-slate-900"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        {question}
        <ChevronDown
          size={20}
          className={`shrink-0 text-slate-400 transition ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open ? <p className="border-t border-slate-100 px-5 pb-4 pt-2 text-slate-600 leading-relaxed">{answer}</p> : null}
    </div>
  )
}

function CtaButton({ children, onClick, variant = 'primary', className = '' }) {
  const styles =
    variant === 'primary'
      ? 'bg-[#005bff] text-white hover:bg-[#004fe0] shadow-lg shadow-blue-500/25'
      : 'border-2 border-[#0088cc] bg-white text-[#0088cc] hover:bg-sky-50'

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center justify-center rounded-xl px-6 py-3.5 text-base font-semibold transition ${styles} ${className}`}
    >
      {children}
    </button>
  )
}

export default function LandingPage() {
  const [paymentOpen, setPaymentOpen] = useState(false)

  useEffect(() => {
    document.title = 'Telebotik — AI-помощник для продавцов Ozon'
    document.documentElement.style.scrollBehavior = 'smooth'
    document.body.style.backgroundColor = '#f8fafc'
    document.body.style.color = '#0f172a'
    return () => {
      document.documentElement.style.scrollBehavior = ''
      document.body.style.backgroundColor = ''
      document.body.style.color = ''
    }
  }, [])

  const openPayment = () => setPaymentOpen(true)

  return (
    <div className="min-h-screen bg-slate-50 font-[system-ui,-apple-system,sans-serif] text-slate-900">
      <PaymentStubModal open={paymentOpen} onClose={() => setPaymentOpen(false)} />

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-2 font-bold text-lg">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 text-white">T</span>
            Telebotik
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <a
              href={BOT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden text-sm font-medium text-[#0088cc] hover:underline sm:inline"
            >
              Демо в Telegram
            </a>
            <CtaButton onClick={openPayment} className="!px-4 !py-2.5 !text-sm">
              {PRICE} ₽/мес
            </CtaButton>
          </div>
        </div>
      </header>

      {/* 1 Hero */}
      <section className="border-b border-slate-200 bg-gradient-to-b from-white to-slate-50">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 lg:grid-cols-2 lg:items-center lg:py-20">
          <div>
            <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-[#005bff]">
              <Bot size={16} />
              Для продавцов на Ozon
            </p>
            <h1 className="mb-4 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-[2.75rem]">
              Больше не теряйте часы на правила Ozon — бот ответит по документам за вас
            </h1>
            <p className="mb-8 max-w-xl text-lg leading-relaxed text-slate-600">
              Telebotik в Telegram: AI-помощник с RAG и GigaChat. Ответы по загруженным документам
              Ozon — возвраты, продажа, правила площадки. Не официальная поддержка, зато быстро и
              по делу.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <CtaButton onClick={openPayment}>Подключить — {PRICE} ₽/мес</CtaButton>
              <CtaButton
                variant="secondary"
                onClick={() => window.open(BOT_URL, '_blank', 'noopener,noreferrer')}
              >
                Посмотреть демо
              </CtaButton>
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-md lg:max-w-none">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-300/40">
              <img
                src="/landing/start.png"
                alt="Приветствие Telebotik в Telegram с кнопками тем"
                className="w-full"
                loading="eager"
              />
            </div>
            <img
              src="/landing/profile.png"
              alt="Профиль бота Telebotik"
              className="absolute -bottom-4 -right-2 w-28 rounded-xl border-4 border-white shadow-lg sm:w-36 lg:-right-6"
              loading="lazy"
            />
          </div>
        </div>
      </section>

      {/* 2 Pain */}
      <section className="border-b border-slate-200 bg-slate-900 py-14 text-white">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="mb-6 text-2xl font-bold sm:text-3xl">Знакомо?</h2>
          <p className="text-lg leading-relaxed text-slate-300">
            Покупатель спрашивает про возврат — вы открываете docs.ozon.ru, листаете десятки
            страниц условий и теряете <strong className="text-white">1–2 часа в день</strong> на
            одни и те же вопросы. Новый сотрудник в команде неделю разбирается в правилах FBO и
            возвратов. Ошибка в формулировке — риск для рейтинга и лишняя переписка с поддержкой.
            При <strong className="text-white">5–10 таких обращениях в неделю</strong> это уже не
            «мелочь», а постоянный налог на время продавца.
          </p>
        </div>
      </section>

      {/* 3 Solution */}
      <section className="border-b border-slate-200 py-14">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-10 text-center">
            <h2 className="mb-3 text-2xl font-bold sm:text-3xl">Как Telebotik это решает</h2>
            <p className="mx-auto max-w-2xl text-slate-600">
              Не просто «чат с AI» — поиск по вашей базе документов Ozon и ответ с опорой на
              найденные фрагменты.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            {benefits.map((benefit) => (
              <BenefitCard key={benefit.feature} {...benefit} />
            ))}
          </div>
          <div className="mt-10 overflow-hidden rounded-2xl border border-slate-200 shadow-lg">
            <img
              src="/landing/help.png"
              alt="Справка Telebotik: RAG и GigaChat"
              className="mx-auto max-h-[480px] w-full object-contain bg-slate-100"
              loading="lazy"
            />
          </div>
        </div>
      </section>

      {/* 4 How it works */}
      <section className="border-b border-slate-200 bg-white py-14">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="mb-10 text-center text-2xl font-bold sm:text-3xl">Как это работает</h2>
          <div className="grid gap-8 md:grid-cols-3">
            {steps.map(({ n, title, text, time }) => (
              <div key={n} className="relative rounded-2xl border border-slate-200 bg-slate-50 p-6">
                <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-[#0088cc] text-lg font-bold text-white">
                  {n}
                </span>
                <h3 className="mb-2 font-bold">{title}</h3>
                <p className="mb-3 text-slate-600 leading-relaxed">{text}</p>
                <span className="inline-flex items-center gap-1 text-sm font-medium text-emerald-700">
                  <Clock size={14} />
                  {time}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <img
              src="/landing/menu-docs.png"
              alt="Меню бота с документами Ozon"
              className="rounded-xl border border-slate-200 shadow-md"
              loading="lazy"
            />
            <img
              src="/landing/ozon-docs.png"
              alt="Официальные документы Ozon — источник базы знаний"
              className="rounded-xl border border-slate-200 shadow-md"
              loading="lazy"
            />
          </div>
        </div>
      </section>

      {/* 5 Social proof */}
      <section className="border-b border-slate-200 py-14">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="mb-3 text-center text-2xl font-bold sm:text-3xl">
            Продавцы уже экономят время
          </h2>
          <p className="mb-10 text-center text-sm text-slate-500">
            Отзывы созданы для демонстрации учебного проекта
          </p>
          <div className="mb-12 grid gap-6 md:grid-cols-3">
            {reviews.map(({ name, role, text }) => (
              <blockquote
                key={name}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <p className="mb-4 text-slate-700 leading-relaxed">&ldquo;{text}&rdquo;</p>
                <footer>
                  <cite className="not-italic font-semibold text-slate-900">{name}</cite>
                  <p className="text-sm text-slate-500">{role}</p>
                </footer>
              </blockquote>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {demoScreens.map(({ src, alt }) => (
              <img
                key={src}
                src={src}
                alt={alt}
                className="rounded-lg border border-slate-200 shadow-sm transition hover:scale-[1.02]"
                loading="lazy"
              />
            ))}
          </div>
        </div>
      </section>

      {/* 6 Pricing */}
      <section className="border-b border-slate-200 bg-gradient-to-b from-blue-50 to-white py-14">
        <div className="mx-auto max-w-lg px-4">
          <h2 className="mb-10 text-center text-2xl font-bold sm:text-3xl">Сколько стоит</h2>
          <div className="relative rounded-2xl border-2 border-[#005bff] bg-white p-8 shadow-xl">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#005bff] px-4 py-1 text-xs font-bold uppercase tracking-wide text-white">
              Популярный
            </span>
            <h3 className="mb-1 text-center text-xl font-bold">Telebotik для продавца</h3>
            <p className="mb-6 text-center text-slate-500">Полный доступ к боту в Telegram</p>
            <p className="mb-2 text-center">
              <span className="text-4xl font-extrabold">{PRICE} ₽</span>
              <span className="text-slate-500">/мес</span>
            </p>
            <p className="mb-6 text-center text-sm text-slate-500">≈ 33 ₽ в день — дешевле часа вашего времени на поиск в документах</p>
            <ul className="mb-8 space-y-3">
              {[
                'Неограниченные вопросы по Ozon для команды',
                'RAG по документам + GigaChat',
                'Кнопки: продажа, возврат, документы',
                'Честные ответы без выдумок',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-slate-700">
                  <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-600" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="mb-6 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
              <strong className="text-slate-800">Сравнение:</strong> консультация по маркетплейсу у
              фрилансера — от 3 000 ₽/час. Telebotik — {PRICE} ₽/мес за типовые вопросы каждый
              день.
            </div>
            <CtaButton onClick={openPayment} className="w-full">
              Оформить — {PRICE} ₽/мес
            </CtaButton>
          </div>
        </div>
      </section>

      {/* 7 FAQ */}
      <section className="border-b border-slate-200 py-14">
        <div className="mx-auto max-w-2xl px-4">
          <h2 className="mb-8 text-center text-2xl font-bold sm:text-3xl">Частые вопросы</h2>
          <div className="space-y-3">
            {faq.map(({ q, a }) => (
              <FaqItem key={q} question={q} answer={a} />
            ))}
          </div>
          <div className="mt-8 overflow-hidden rounded-xl border border-slate-200">
            <img
              src="/landing/focus-ozon.png"
              alt="Бот отвечает только по темам Ozon"
              className="w-full"
              loading="lazy"
            />
          </div>
        </div>
      </section>

      {/* 8 Final CTA */}
      <section className="bg-slate-900 py-16 text-white">
        <div className="mx-auto max-w-2xl px-4 text-center">
          <h2 className="mb-4 text-2xl font-bold sm:text-3xl">
            Хватит терять время на поиск в документах Ozon
          </h2>
          <p className="mb-8 text-lg text-slate-300">
            Подключите Telebotik за {PRICE} ₽/мес или протестируйте бота бесплатно прямо сейчас.
          </p>
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <CtaButton onClick={openPayment}>Подключить — {PRICE} ₽/мес</CtaButton>
            <CtaButton
              variant="secondary"
              className="!border-slate-600 !text-white hover:!bg-slate-800"
              onClick={() => window.open(BOT_URL, '_blank', 'noopener,noreferrer')}
            >
              Открыть демо в Telegram
            </CtaButton>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white py-8 text-center text-sm text-slate-500">
        <p className="font-medium text-slate-700">Telebotik · учебный проект</p>
        <p className="mt-1">
          <a href={BOT_URL} className="text-[#0088cc] hover:underline">
            @telebotik200526_bot
          </a>
          {' · '}
          <a href="https://days100.ru/" className="hover:underline">
            days100.ru
          </a>
        </p>
      </footer>
    </div>
  )
}
