import { test, expect } from '@playwright/test';

// Protected test - requires authentication
test.describe('Profile Page', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to profile page - authentication is handled by the global setup
    await page.goto('/profile');
    await page.waitForLoadState('domcontentloaded');
    
    // If we get redirected to login, something is wrong with auth
    if (page.url().includes('/auth/login')) {
      throw new Error('Authentication failed - redirected to login page');
    }
  });

  test('should display profile page successfully', async ({ page }) => {
    await expect(page).toHaveURL(/.*\/profile/);
    
    // Check for profile page elements
    await expect(page.locator('h1, h2').filter({ hasText: /profile|account|user/i })).toBeVisible();
  });

  test('should display user information', async ({ page }) => {
    await expect(page).toHaveURL(/.*\/profile/);
    
    // Look for user-related elements like avatar, name, email sections
    const userElements = [
      page.locator('[data-testid="user-avatar"], img[alt*="avatar" i], img[alt*="profile" i]'),
      page.locator('input[type="email"], [data-testid="user-email"]'),
      page.locator('input[name="name"], input[name="username"], [data-testid="user-name"]')
    ];

    // At least one user element should be visible
    let foundUserElement = false;
    for (const element of userElements) {
      if (await element.count() > 0) {
        foundUserElement = true;
        break;
      }
    }
    expect(foundUserElement).toBeTruthy();
  });

  test('should have navigation accessible', async ({ page }) => {
    await expect(page).toHaveURL(/.*\/profile/);
    
    // Check navigation is present
    await expect(page.locator('nav')).toBeVisible();
    
    // Should be able to navigate back to apps
    const appsLink = page.locator('a[href="/apps"], a').filter({ hasText: /apps|dashboard/i });
    if (await appsLink.count() > 0) {
      await expect(appsLink.first()).toBeVisible();
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page).toHaveURL(/.*\/profile/);
    
    // Check mobile responsiveness
    await expect(page.locator('nav')).toBeVisible();
  });

  test('should handle form interactions if present', async ({ page }) => {
    await expect(page).toHaveURL(/.*\/profile/);
    
    // Look for form elements
    const forms = page.locator('form');
    const saveButton = page.locator('button').filter({ hasText: /save|update|submit/i });
    
    if (await forms.count() > 0) {
      await expect(forms.first()).toBeVisible();
      
      if (await saveButton.count() > 0) {
        await expect(saveButton.first()).toBeVisible();
      }
    }
  });
});
