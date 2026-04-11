import { useEffect, useState } from 'react'

import Card from '../components/Card'
import { useAuth } from '../context/AuthContext'
import { apiRequest } from '../services/api'

export default function FeedPage() {
  const { token } = useAuth()
  const [items, setItems] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiRequest('/feed/challenges', {}, token)
        setItems(data)
      } catch (e) {
        setError(e.message)
      }
    }
    load()
  }, [])

  return (
    <div className="grid gap-4">
      <Card>
        <h2 className="text-xl font-black uppercase">Лента участников</h2>
        <p className="text-sm">Здесь видны испытания других игроков и их прогресс.</p>
      </Card>
      {error ? <Card className="bg-block-fail">{error}</Card> : null}
      {items.map((item) => (
        <Card key={item.challenge_id}>
          <h3 className="text-lg font-black uppercase">{item.title}</h3>
          <p className="text-sm">Игрок: {item.owner_name}</p>
          <p className="text-sm">Успехов подряд: {item.success_days}</p>
          <p className="text-sm">Всего отмечено дней: {item.total_days}</p>
          <p className="text-sm">Награда: {item.reward || 'Пока нет'}</p>
          <p className="text-sm">Статус: {item.is_finished ? 'Завершено' : 'В процессе'}</p>
        </Card>
      ))}
    </div>
  )
}
