import { defineConfig, devices } from '@playwright/test'

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000'
const slowMoMs = process.env.PW_SLOW_MS ? Number(process.env.PW_SLOW_MS) : undefined

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
    locale: 'ru-RU',
    ...(slowMoMs && !Number.isNaN(slowMoMs) ? { launchOptions: { slowMo: slowMoMs } } : {}),
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})
