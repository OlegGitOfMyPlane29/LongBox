import { zodResolver } from '@hookform/resolvers/zod'
import { ThumbsDown, ThumbsUp, Trophy } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import Button from '../components/Button'
import Card from '../components/Card'
import TextInput from '../components/TextInput'
import { useAuth } from '../context/AuthContext'
import { apiRequest } from '../services/api'

const createChallengeSchema = z.object({
  title: z.string().min(2, 'Название слишком короткое').max(120, 'Слишком длинное название'),
  habit1: z.string().min(1, 'Хотя бы одна привычка обязательна').max(80, 'Макс. 80 символов'),
  habit2: z.string().max(80, 'Макс. 80 символов').optional(),
  habit3: z.string().max(80, 'Макс. 80 символов').optional(),
})

export default function DashboardPage() {
  const { token, user } = useAuth()
  const [challenges, setChallenges] = useState([])
  const [quote, setQuote] = useState(null)
  const [quoteError, setQuoteError] = useState('')
  const [quoteLoading, setQuoteLoading] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [logForms, setLogForms] = useState({})
  const [logErrors, setLogErrors] = useState({})
  const [editForms, setEditForms] = useState({})

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(createChallengeSchema), defaultValues: { title: '', habit1: '', habit2: '', habit3: '' } })

  const loadChallenges = useCallback(async () => {
    setLoading(true)
    try {
      const data = await apiRequest('/challenges/me', {}, token)
      setChallenges(data)
      setError('')
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    loadChallenges()
  }, [loadChallenges])

  const loadQuote = useCallback(async () => {
    setQuoteLoading(true)
    try {
      const data = await apiRequest('/quotes/random')
      setQuote(data)
      setQuoteError('')
    } catch (e) {
      setQuoteError(e.message)
    } finally {
      setQuoteLoading(false)
    }
  }, [])

  useEffect(() => {
    loadQuote()
  }, [loadQuote])

  const createChallenge = async (values) => {
    const habits = [values.habit1, values.habit2, values.habit3].map((item) => item.trim()).filter(Boolean)
    try {
      await apiRequest('/challenges', { method: 'POST', body: JSON.stringify({ title: values.title, habits }) }, token)
      reset()
      loadChallenges()
    } catch (e) {
      setError(e.message)
    }
  }

  const setLogValue = (challengeId, field, value) => {
    setLogForms((prev) => ({ ...prev, [challengeId]: { ...(prev[challengeId] || {}), [field]: value } }))
  }

  const submitLog = async (challenge, status) => {
    const form = logForms[challenge.id] || {}
    if (!form.comment || form.comment.length > 300) {
      setLogErrors((prev) => ({ ...prev, [challenge.id]: 'Комментарий обязателен и не длиннее 300 символов' }))
      return
    }
    if (challenge.logs.length === 99 && status === 'success' && !form.final_comment) {
      setLogErrors((prev) => ({ ...prev, [challenge.id]: 'На 100-й день обязателен итоговый комментарий' }))
      return
    }
    try {
      await apiRequest(
        `/challenges/${challenge.id}/logs`,
        { method: 'POST', body: JSON.stringify({ status, comment: form.comment, final_comment: form.final_comment || null }) },
        token,
      )
      setLogErrors((prev) => ({ ...prev, [challenge.id]: '' }))
      setLogForms((prev) => ({ ...prev, [challenge.id]: { comment: '', final_comment: '' } }))
      loadChallenges()
    } catch (e) {
      setLogErrors((prev) => ({ ...prev, [challenge.id]: e.message }))
    }
  }

  const removeChallenge = async (challengeId) => {
    try {
      await apiRequest(`/challenges/${challengeId}`, { method: 'DELETE' }, token)
      loadChallenges()
    } catch (e) {
      setError(e.message)
    }
  }

  const setEditValue = (challengeId, field, value) => {
    setEditForms((prev) => ({ ...prev, [challengeId]: { ...(prev[challengeId] || {}), [field]: value } }))
  }

  const prepareEdit = (challenge) => {
    setEditForms((prev) => ({
      ...prev,
      [challenge.id]: {
        title: challenge.title,
        habits: challenge.habits.map((item) => item.name).join(', '),
      },
    }))
  }

  const updateChallenge = async (challengeId) => {
    const form = editForms[challengeId]
    if (!form) return

    const habits = form.habits
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)

    if (!form.title || form.title.length < 2 || habits.length < 1 || habits.length > 3) {
      setError('Для редактирования укажите название (от 2 символов) и от 1 до 3 привычек')
      return
    }
    try {
      await apiRequest(`/challenges/${challengeId}`, { method: 'PATCH', body: JSON.stringify({ title: form.title, habits }) }, token)
      setError('')
      loadChallenges()
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <div className="grid gap-4">
      <Card>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xl font-black uppercase">Цитата дня</h2>
          <Button variant="accent" onClick={loadQuote} disabled={quoteLoading}>
            {quoteLoading ? 'Обновляем...' : 'Обновить'}
          </Button>
        </div>
        {quote ? (
          <>
            <p className="text-base font-semibold">"{quote.content}"</p>
            <p className="mt-2 text-sm">- {quote.author}</p>
          </>
        ) : (
          <p className="text-sm">Загружаем мотивацию...</p>
        )}
        {quoteError ? <p className="mt-2 text-sm font-semibold text-red-200">{quoteError}</p> : null}
      </Card>

      <Card>
        <h2 className="mb-3 text-xl font-black uppercase">Начать испытание</h2>
        <p className="mb-3 text-sm">Игрок: {user?.display_name}. Добавь до 3 привычек и стартуй 100 дней.</p>
        <form className="grid gap-3 md:grid-cols-2" onSubmit={handleSubmit(createChallenge)}>
          <div className="md:col-span-2">
            <TextInput label="Название испытания" error={errors.title?.message} {...register('title')} />
          </div>
          <TextInput label="Привычка #1" error={errors.habit1?.message} {...register('habit1')} />
          <TextInput label="Привычка #2 (необязательно)" error={errors.habit2?.message} {...register('habit2')} />
          <TextInput label="Привычка #3 (необязательно)" error={errors.habit3?.message} {...register('habit3')} />
          <div className="md:col-span-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Создание...' : 'Начать испытание'}
            </Button>
          </div>
        </form>
      </Card>

      {error ? <Card className="bg-block-fail">{error}</Card> : null}

      {loading ? <Card>Загрузка испытаний...</Card> : null}

      {challenges.map((challenge) => (
        <Card key={challenge.id}>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-lg font-black uppercase">{challenge.title}</h3>
            <div className="flex items-center gap-2 text-sm font-bold">
              <Trophy size={16} />
              {challenge.reward || 'Награда пока не получена'}
            </div>
          </div>
          <p className="mb-2 text-sm">Прогресс: {challenge.logs.length}/100 дней</p>
          <div className="mb-3 flex flex-wrap gap-2">
            {challenge.habits.map((habit) => (
              <span key={habit.id} className="border-4 border-black bg-block-muted px-2 py-1 text-xs uppercase">
                {habit.name}
              </span>
            ))}
          </div>

          {!challenge.is_finished && (
            <div className="mb-3 grid gap-2 border-4 border-black bg-block-bg p-2">
              <p className="text-xs font-semibold uppercase">Редактирование испытания</p>
              <input
                className="border-4 border-black bg-stone-200 p-2 text-black"
                value={editForms[challenge.id]?.title ?? ''}
                placeholder="Новое название"
                onFocus={() => !editForms[challenge.id] && prepareEdit(challenge)}
                onChange={(event) => setEditValue(challenge.id, 'title', event.target.value)}
              />
              <input
                className="border-4 border-black bg-stone-200 p-2 text-black"
                value={editForms[challenge.id]?.habits ?? ''}
                placeholder="Привычки через запятую"
                onFocus={() => !editForms[challenge.id] && prepareEdit(challenge)}
                onChange={(event) => setEditValue(challenge.id, 'habits', event.target.value)}
              />
              <div>
                <Button variant="accent" onClick={() => updateChallenge(challenge.id)}>
                  Сохранить изменения
                </Button>
              </div>
            </div>
          )}

          {challenge.is_finished ? (
            <p className="text-sm font-semibold">Испытание завершено. Итог: {challenge.final_comment || 'Без комментария'}.</p>
          ) : (
            <div className="grid gap-2">
              <textarea
                value={logForms[challenge.id]?.comment || ''}
                onChange={(event) => setLogValue(challenge.id, 'comment', event.target.value)}
                maxLength={300}
                className="min-h-20 border-4 border-black bg-stone-200 p-2 text-black"
                placeholder="Комментарий к текущему дню (до 300 символов)"
              />
              {challenge.logs.length === 99 && (
                <textarea
                  value={logForms[challenge.id]?.final_comment || ''}
                  onChange={(event) => setLogValue(challenge.id, 'final_comment', event.target.value)}
                  maxLength={300}
                  className="min-h-20 border-4 border-black bg-stone-200 p-2 text-black"
                  placeholder="Итоговый комментарий (обязателен на 100-й день)"
                />
              )}
              {logErrors[challenge.id] ? <p className="text-sm font-semibold text-red-200">{logErrors[challenge.id]}</p> : null}
              <div className="flex flex-wrap gap-2">
                <Button variant="primary" className="flex items-center gap-2" onClick={() => submitLog(challenge, 'success')}>
                  <ThumbsUp size={16} />
                  Успех
                </Button>
                <Button variant="danger" className="flex items-center gap-2" onClick={() => submitLog(challenge, 'fail')}>
                  <ThumbsDown size={16} />
                  Провал
                </Button>
                <Button variant="neutral" className="ml-auto" onClick={() => removeChallenge(challenge.id)}>
                  Удалить испытание
                </Button>
              </div>
            </div>
          )}
        </Card>
      ))}
    </div>
  )
}
