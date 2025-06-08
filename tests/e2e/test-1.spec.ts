import { test, expect } from '@playwright/test';

test('should show 404 page for non-existent routes', async ({ page }) => {
  await page.goto('/NON');
  await expect(page.locator('h2')).toContainText('This page could not be found.');
});