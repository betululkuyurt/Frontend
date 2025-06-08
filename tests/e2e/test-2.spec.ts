import { test, expect } from '@playwright/test';

test('should access protected dashboard when authenticated', async ({ page }) => {
  // This test runs with authentication setup
  await page.goto('/apps');
  
  // Should be able to access the dashboard
  await expect(page).toHaveURL(/.*\/apps/);
  
  // Should see authenticated user interface
  await expect(page.locator('nav')).toBeVisible();
});