import { test, expect } from '@playwright/test';

test.describe('Navigation and Routing', () => {
  test('should navigate between public pages', async ({ page }) => {
    // Start from home page
    await page.goto('/');
    await expect(page).toHaveURL('/');
    
    // Navigate to login
    await page.click('text=Sign in');
    await expect(page).toHaveURL(/.*\/auth\/login/);
    
    // Navigate back to home (if there's a home link/logo)
    const homeLink = page.locator('a[href="/"], a').filter({ hasText: /home|logo/i });
    if (await homeLink.count() > 0) {
      await homeLink.first().click();
      await expect(page).toHaveURL('/');
    }
  });

  test('should handle 404 pages', async ({ page }) => {
    // Navigate to non-existent page
    await page.goto('/non-existent-page');
    
    // Should show 404 page or redirect
      await expect(page.locator('h2')).toContainText('This page could not be found.');
  });

  test('should maintain state across navigation', async ({ page }) => {
    await page.goto('/');
    
    // Check if any state is maintained (like theme, etc.)
    // This is a basic test - adjust based on your app's state management
    const htmlElement = page.locator('html');
    const initialClasses = await htmlElement.getAttribute('class') || '';
    
    // Navigate to another page
    await page.click('text=Sign in');
    await expect(page).toHaveURL(/.*\/auth\/login/);
    
    // Check if theme/state is maintained
    const loginClasses = await htmlElement.getAttribute('class') || '';
    
    // If you have theme classes, they should be maintained
    if (initialClasses.includes('dark') || initialClasses.includes('light')) {
      expect(loginClasses).toContain(initialClasses.includes('dark') ? 'dark' : 'light');
    }
  });

  test('should have proper browser back/forward functionality', async ({ page }) => {
    // Start from home
    await page.goto('/');
    
    // Navigate to login
    await page.click('text=Sign in');
    await expect(page).toHaveURL(/.*\/auth\/login/);
    
    // Use browser back button
    await page.goBack();
    await expect(page).toHaveURL('/');
    
    // Use browser forward button
    await page.goForward();
    await expect(page).toHaveURL(/.*\/auth\/login/);
  });
});
