import { expect, test } from '@playwright/test'

test.describe('Сценарий: регистрация и главная страница', () => {
  test('Пользователь регистрируется и попадает на главную страницу', async ({ page }) => {
    const email = `e2e.reg.${Date.now()}@example.com`

    await page.goto('/auth')
    await page.getByRole('button', { name: 'Регистрация' }).click()
    await page.getByRole('textbox', { name: /Ник игрока/i }).fill('E2E Тестер')
    await page.getByRole('textbox', { name: /Email/i }).fill(email)
    await page.getByRole('textbox', { name: /Пароль/i }).fill('123456')
    await page.getByRole('button', { name: 'Создать аккаунт' }).click()

    await expect(page.getByRole('heading', { name: /Начать испытание/i })).toBeVisible({ timeout: 20000 })
    await expect(page.getByRole('navigation').getByRole('link', { name: 'Дашборд' })).toBeVisible()
  })
})
