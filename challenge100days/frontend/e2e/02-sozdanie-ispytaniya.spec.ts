import { expect, test } from '@playwright/test'

import { E2E_EMAIL, E2E_PASSWORD } from './helpers/env'
import { loginViaUi } from './helpers/ui'

test.describe('Сценарий: создание испытания', () => {
  test('Пользователь создаёт испытание', async ({ page }) => {
    await loginViaUi(page, E2E_EMAIL, E2E_PASSWORD)

    const title = `E2E Создание ${Date.now()}`
    await page.getByRole('textbox', { name: /Название испытания/i }).fill(title)
    await page.getByRole('textbox', { name: /Привычка #1/i }).fill('Утренняя зарядка')
    await page.getByRole('button', { name: 'Начать испытание' }).click()

    await expect(page.getByRole('heading', { level: 3, name: title })).toBeVisible({ timeout: 15000 })
    await expect(page.getByRole('heading', { level: 3, name: title }).locator('xpath=ancestor::section[1]')).toContainText(
      'Прогресс: 0/100 дней',
    )
  })
})
