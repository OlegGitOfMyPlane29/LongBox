import { expect, test } from '@playwright/test'

import { apiAddDayLog, apiCreateChallenge, apiLogin } from './helpers/api'
import { E2E_EMAIL, E2E_PASSWORD } from './helpers/env'
import { challengeCard, setAuthInBrowser } from './helpers/ui'

test.describe('Сценарий: медный кубок при провале', () => {
  test('Пользователь проходит испытание неуспешно и получает медный кубок', async ({ page, request }) => {
    const { token, user } = await apiLogin(request, E2E_EMAIL, E2E_PASSWORD)
    const title = `E2E Медь ${Date.now()}`
    const challenge = await apiCreateChallenge(request, token, title, ['Режим'])

    for (let day = 1; day <= 3; day += 1) {
      await apiAddDayLog(request, token, challenge.id, {
        status: 'success',
        comment: `Успешный день ${day}`,
      })
    }

    await setAuthInBrowser(page, token, user)
    await page.goto('/')

    const card = challengeCard(page, title)
    await expect(card).toContainText('Прогресс: 3/100 дней')

    await card.getByPlaceholder('Комментарий к текущему дню (до 300 символов)').fill('На четвёртый день сорвался')
    await card.getByRole('button', { name: 'Провал' }).click()

    await expect(card).toContainText('Медный кубок', { timeout: 15000 })
    await expect(card).toContainText('Испытание завершено')
  })
})
