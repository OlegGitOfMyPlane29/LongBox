import { expect, test } from '@playwright/test'

import { E2E_EMAIL, E2E_PASSWORD } from './helpers/env'

test.describe('Сценарий: авторизация (вход)', () => {
  test('Пользователь входит по email и паролю и попадает на дашборд', async ({ page }) => {
    await page.goto('/auth')
    await page.getByRole('button', { name: 'Вход' }).click()
    await page.getByRole('textbox', { name: /Email/i }).fill(E2E_EMAIL)
    await page.getByRole('textbox', { name: /Пароль/i }).fill(E2E_PASSWORD)
    await page.getByRole('button', { name: 'Войти' }).click()

    await expect(page.getByRole('heading', { name: /Начать испытание/i })).toBeVisible({ timeout: 20000 })
    await expect(page.getByRole('navigation').getByRole('link', { name: 'Дашборд' })).toBeVisible()
  })
})
