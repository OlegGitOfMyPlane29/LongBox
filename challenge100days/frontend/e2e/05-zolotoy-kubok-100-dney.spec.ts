import { expect, test } from '@playwright/test'

import { apiAddDayLog, apiCreateChallenge, apiLogin } from './helpers/api'
import { E2E_EMAIL, E2E_PASSWORD } from './helpers/env'
import { challengeCard, setAuthInBrowser } from './helpers/ui'

test.describe('Сценарий: золотой кубок за 100 дней', () => {
  test('Пользователь проходит испытание успешно, все 100 дней и получает золотой кубок', async ({
    page,
    request,
  }) => {
    const { token, user } = await apiLogin(request, E2E_EMAIL, E2E_PASSWORD)
    const title = `E2E Золото ${Date.now()}`
    const challenge = await apiCreateChallenge(request, token, title, ['Дисциплина'])

    for (let day = 1; day <= 99; day += 1) {
      await apiAddDayLog(request, token, challenge.id, {
        status: 'success',
        comment: `День ${day} пройден`,
      })
    }

    await setAuthInBrowser(page, token, user)
    await page.goto('/')

    const card = challengeCard(page, title)
    await expect(card).toContainText('Прогресс: 99/100 дней')

    await card.getByPlaceholder('Комментарий к текущему дню (до 300 символов)').fill('Финальный рывок')
    await card.getByPlaceholder('Итоговый комментарий (обязателен на 100-й день)').fill('100 дней позади — победа!')
    await card.getByRole('button', { name: 'Успех' }).click()

    await expect(card).toContainText('Золотой кубок', { timeout: 15000 })
    await expect(card).toContainText('Испытание завершено')
  })
})
