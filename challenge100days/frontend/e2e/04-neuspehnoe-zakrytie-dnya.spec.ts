import { expect, test } from '@playwright/test'

import { E2E_EMAIL, E2E_PASSWORD } from './helpers/env'
import { challengeCard, loginViaUi } from './helpers/ui'

test.describe('Сценарий: неуспешное закрытие дня', () => {
  test('Пользователь закрывает день неуспешно', async ({ page }) => {
    await loginViaUi(page, E2E_EMAIL, E2E_PASSWORD)

    const title = `E2E Провал дня ${Date.now()}`
    await page.getByRole('textbox', { name: /Название испытания/i }).fill(title)
    await page.getByRole('textbox', { name: /Привычка #1/i }).fill('Медитация')
    await page.getByRole('button', { name: 'Начать испытание' }).click()

    const card = challengeCard(page, title)
    await card.getByPlaceholder('Комментарий к текущему дню (до 300 символов)').fill('Сорвался в первый же день')
    await card.getByRole('button', { name: 'Провал' }).click()

    await expect(card).toContainText('Медный кубок', { timeout: 15000 })
    await expect(card).toContainText('Испытание завершено')
  })
})
