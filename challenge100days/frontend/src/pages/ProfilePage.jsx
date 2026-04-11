import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import Button from '../components/Button'
import Card from '../components/Card'
import TextInput from '../components/TextInput'
import { useAuth } from '../context/AuthContext'
import { apiRequest } from '../services/api'

const profileSchema = z.object({
  display_name: z.string().min(2, 'Минимум 2 символа').max(100, 'Максимум 100 символов'),
  password: z.string().min(6, 'Минимум 6 символов').max(100, 'Максимум 100 символов').optional().or(z.literal('')),
})

export default function ProfilePage() {
  const { token, user, logout, setUser } = useAuth()
  const [message, setMessage] = useState('')
  const [users, setUsers] = useState([])

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(profileSchema), defaultValues: { display_name: user?.display_name || '', password: '' } })

  useEffect(() => {
    reset({ display_name: user?.display_name || '', password: '' })
  }, [user])

  useEffect(() => {
    if (user?.role !== 'admin') return
    const loadUsers = async () => {
      try {
        const data = await apiRequest('/users', {}, token)
        setUsers(data)
      } catch (e) {
        setMessage(e.message)
      }
    }
    loadUsers()
  }, [user])

  const onSubmit = async (values) => {
    setMessage('')
    try {
      const payload = { display_name: values.display_name }
      if (values.password) payload.password = values.password
      const updated = await apiRequest('/users/me', { method: 'PATCH', body: JSON.stringify(payload) }, token)
      setUser(updated)
      setMessage('Профиль успешно обновлен')
      reset({ display_name: updated.display_name, password: '' })
    } catch (e) {
      setMessage(e.message)
    }
  }

  const deleteMe = async () => {
    try {
      await apiRequest('/users/me', { method: 'DELETE' }, token)
      logout()
    } catch (e) {
      setMessage(e.message)
    }
  }

  return (
    <div className="grid gap-4">
      <Card>
        <h2 className="mb-2 text-xl font-black uppercase">Профиль игрока</h2>
        <p>Email: {user?.email}</p>
        <p>Роль: {user?.role === 'admin' ? 'Администратор' : 'Пользователь'}</p>
      </Card>

      <Card>
        <h3 className="mb-2 font-black uppercase">Редактировать профиль</h3>
        <form className="grid gap-3 md:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
          <TextInput label="Никнейм" error={errors.display_name?.message} {...register('display_name')} />
          <TextInput label="Новый пароль (необязательно)" error={errors.password?.message} type="password" {...register('password')} />
          <div className="md:col-span-2 flex flex-wrap gap-2">
            <Button type="submit" disabled={isSubmitting}>
              Сохранить
            </Button>
            <Button type="button" variant="danger" onClick={deleteMe}>
              Удалить профиль
            </Button>
          </div>
        </form>
        {message ? <p className="mt-2 text-sm font-semibold">{message}</p> : null}
      </Card>

      {user?.role === 'admin' && (
        <Card>
          <h3 className="mb-2 font-black uppercase">Админ: список пользователей</h3>
          <div className="grid gap-2">
            {users.map((item) => (
              <div key={item.id} className="border-4 border-black bg-block-muted p-2 text-sm">
                {item.display_name} ({item.email}) - {item.role}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
