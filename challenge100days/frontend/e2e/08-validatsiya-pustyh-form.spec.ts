import { expect, test } from '@playwright/test'

test.describe('Сценарий: валидация форм', () => {
  test('Форма входа: отправка пустых полей показывает ошибки', async ({ page }) => {
    await page.goto('/auth')
    await page.getByRole('button', { name: 'Вход' }).click()
    await page.getByRole('button', { name: 'Войти' }).click()

    await expect(page.getByText('Введите корректный email')).toBeVisible()
    await expect(page.getByText('Пароль должен быть не короче 6 символов')).toBeVisible()
    await expect(page).toHaveURL(/\/auth/)
  })

  test('Форма регистрации: отправка пустых полей показывает ошибки', async ({ page }) => {
    await page.goto('/auth')
    await page.getByRole('button', { name: 'Регистрация' }).click()
    await page.getByRole('button', { name: 'Создать аккаунт' }).click()

    await expect(page.getByText('Имя должно быть не короче 2 символов')).toBeVisible()
    await expect(page.getByText('Введите корректный email')).toBeVisible()
    await expect(page.getByText('Пароль должен быть не короче 6 символов')).toBeVisible()
    await expect(page).toHaveURL(/\/auth/)
  })
})
