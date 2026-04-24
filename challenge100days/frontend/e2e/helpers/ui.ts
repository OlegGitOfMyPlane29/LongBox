import type { Page } from '@playwright/test'
import type { User } from './types'

export async function setAuthInBrowser(page: Page, token: string, user: User) {
  await page.goto('/auth')
  await page.evaluate(
    (state) => {
      localStorage.setItem('challenge100days-auth', JSON.stringify(state))
    },
    { token, user },
  )
}

export async function loginViaUi(page: Page, email: string, password: string) {
  await page.goto('/auth')
  await page.getByRole('button', { name: 'Вход' }).click()
  await page.getByRole('textbox', { name: /Email/i }).fill(email)
  await page.getByRole('textbox', { name: /Пароль/i }).fill(password)
  await page.getByRole('button', { name: 'Войти' }).click()
  await page.getByRole('heading', { name: /Начать испытание/i }).waitFor({ state: 'visible', timeout: 20000 })
}

/** Карточка испытания по заголовку (h3 внутри section). */
export function challengeCard(page: Page, title: string) {
  return page.getByRole('heading', { level: 3, name: title }).locator('xpath=ancestor::section[1]')
}
