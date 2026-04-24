import { expect, test } from '@playwright/test'

import { E2E_EMAIL, E2E_PASSWORD } from './helpers/env'
import { challengeCard, loginViaUi } from './helpers/ui'

test.describe('Сценарий: успешное закрытие дня', () => {
  test('Пользователь закрывает день успешно', async ({ page }) => {
    await loginViaUi(page, E2E_EMAIL, E2E_PASSWORD)

    const title = `E2E Успех дня ${Date.now()}`
    await page.getByRole('textbox', { name: /Название испытания/i }).fill(title)
    await page.getByRole('textbox', { name: /Привычка #1/i }).fill('Чтение')
    await page.getByRole('button', { name: 'Начать испытание' }).click()

    const card = challengeCard(page, title)
    await expect(card).toContainText('Прогресс: 0/100 дней')

    await card.getByPlaceholder('Комментарий к текущему дню (до 300 символов)').fill('Отличный день')
    await card.getByRole('button', { name: 'Успех' }).click()

    await expect(card).toContainText('Прогресс: 1/100 дней', { timeout: 15000 })
  })
})
