import { test, expect } from "@playwright/test";

test("главная: кнопка ПОЕХАЛИ видна", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "ПОЕХАЛИ" })).toBeVisible();
});

test("навигация: лента открывается", async ({ page }) => {
  await page.goto("/feed");
  await expect(page.getByRole("heading", { name: "Общая лента" })).toBeVisible();
});
