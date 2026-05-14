import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

/** Должен совпадать со счётчиком в index.html (или задать VITE_YANDEX_METRIKA_ID). */
const COUNTER_ID = Number(import.meta.env.VITE_YANDEX_METRIKA_ID || 109217208)

export default function YandexMetrikaTracker() {
  const location = useLocation()
  const isFirstNavigation = useRef(true)

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.ym !== 'function') return

    if (isFirstNavigation.current) {
      isFirstNavigation.current = false
      return
    }

    window.ym(COUNTER_ID, 'hit', `${location.pathname}${location.search}`, {
      title: document.title,
    })
  }, [location.pathname, location.search])

  return null
}
