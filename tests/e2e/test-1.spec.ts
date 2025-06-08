import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('http://localhost:3000/NON');
  await expect(page.locator('h2')).toContainText('This page could not be found.');
});