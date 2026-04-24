import type { APIRequestContext } from '@playwright/test'

import { E2E_API_URL } from './env'

type User = {
  id: number
  email: string
  display_name: string
  role: string
  created_at?: string
}

export async function apiLogin(request: APIRequestContext, email: string, password: string) {
  const res = await request.post(`${E2E_API_URL}/auth/login`, {
    data: { email, password },
  })
  if (!res.ok()) throw new Error(`Вход API не удался: ${res.status()} ${await res.text()}`)
  const body = await res.json()
  return { token: body.access_token as string, user: body.user as User }
}

export async function apiRegister(
  request: APIRequestContext,
  display_name: string,
  email: string,
  password: string,
) {
  const res = await request.post(`${E2E_API_URL}/auth/register`, {
    data: { display_name, email, password },
  })
  if (!res.ok()) throw new Error(`Регистрация API не удалась: ${res.status()} ${await res.text()}`)
  const body = await res.json()
  return { token: body.access_token as string, user: body.user as User }
}

export async function apiCreateChallenge(
  request: APIRequestContext,
  token: string,
  title: string,
  habits: string[],
) {
  const res = await request.post(`${E2E_API_URL}/challenges`, {
    data: { title, habits },
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok()) throw new Error(`Создание испытания API не удалось: ${res.status()} ${await res.text()}`)
  return res.json() as Promise<{ id: number; title: string }>
}

export async function apiAddDayLog(
  request: APIRequestContext,
  token: string,
  challengeId: number,
  payload: { status: 'success' | 'fail'; comment: string; final_comment?: string | null },
) {
  const res = await request.post(`${E2E_API_URL}/challenges/${challengeId}/logs`, {
    data: payload,
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok()) throw new Error(`Лог дня API не удался: ${res.status()} ${await res.text()}`)
  return res.json() as Promise<{ reward?: string | null; is_finished?: boolean; logs: unknown[] }>
}
