import { chromium } from '@playwright/test'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outFile = path.join(__dirname, '..', 'playwright-report-screenshot.png')
const reportUrl = process.env.PLAYWRIGHT_REPORT_URL ?? 'http://127.0.0.1:9324/'

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 920 } })
try {
  await page.goto(reportUrl, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.getByText(/passed|пройден|All/i).first().waitFor({ state: 'visible', timeout: 15000 }).catch(() => {})
  await page.waitForTimeout(800)
  await page.screenshot({ path: outFile, fullPage: true })
  console.log('Saved:', outFile)
} finally {
  await browser.close()
}
