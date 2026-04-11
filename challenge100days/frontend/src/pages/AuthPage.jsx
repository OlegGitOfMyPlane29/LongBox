import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Navigate } from 'react-router-dom'
import { z } from 'zod'

import Button from '../components/Button'
import Card from '../components/Card'
import TextInput from '../components/TextInput'
import { useAuth } from '../context/AuthContext'
import { apiRequest } from '../services/api'

const registerSchema = z.object({
  display_name: z.string().min(2, 'Имя должно быть не короче 2 символов').max(100, 'Слишком длинное имя'),
  email: z.string().email('Введите корректный email'),
  password: z.string().min(6, 'Пароль должен быть не короче 6 символов'),
})

const loginSchema = z.object({
  email: z.string().email('Введите корректный email'),
  password: z.string().min(6, 'Пароль должен быть не короче 6 символов'),
})

export default function AuthPage() {
  const [mode, setMode] = useState('login')
  const [serverError, setServerError] = useState('')
  const { login, isAuthenticated } = useAuth()

  const schema = mode === 'login' ? loginSchema : registerSchema
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema), mode: 'onChange' })

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  const onSubmit = async (values) => {
    setServerError('')
    const path = mode === 'login' ? '/auth/login' : '/auth/register'
    try {
      const data = await apiRequest(path, { method: 'POST', body: JSON.stringify(values) })
      login(data.access_token, data.user)
    } catch (error) {
      setServerError(error.message)
    }
  }

  return (
    <div className="mx-auto mt-16 w-full max-w-lg">
      <Card>
        <h1 className="mb-4 text-2xl font-black uppercase">Вход в challenge100days</h1>
        <div className="mb-4 flex gap-2">
          <Button variant={mode === 'login' ? 'accent' : 'neutral'} onClick={() => setMode('login')}>
            Вход
          </Button>
          <Button variant={mode === 'register' ? 'accent' : 'neutral'} onClick={() => setMode('register')}>
            Регистрация
          </Button>
        </div>
        <form className="grid gap-3" onSubmit={handleSubmit(onSubmit)}>
          {mode === 'register' && (
            <TextInput
              label="Ник игрока"
              placeholder="Например, Кубоход"
              error={errors.display_name?.message}
              {...register('display_name')}
            />
          )}
          <TextInput label="Email" placeholder="player@mail.ru" error={errors.email?.message} {...register('email')} />
          <TextInput
            label="Пароль"
            type="password"
            placeholder="******"
            error={errors.password?.message}
            {...register('password')}
          />
          {serverError ? <p className="font-semibold text-red-200">{serverError}</p> : null}
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? 'Отправка...' : mode === 'login' ? 'Войти' : 'Создать аккаунт'}
          </Button>
        </form>
      </Card>
    </div>
  )
}
