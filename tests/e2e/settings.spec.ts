import { test, expect } from '@playwright/test';

// Protected test - requires authentication
test.describe('Settings Page', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to settings page - authentication is handled by the global setup
    await page.goto('/settings');
    await page.waitForLoadState('domcontentloaded');
    
    // If we get redirected to login, something is wrong with auth
    if (page.url().includes('/auth/login')) {
      throw new Error('Authentication failed - redirected to login page');
    }
  });

  test('should display settings page successfully', async ({ page }) => {
    await expect(page).toHaveURL(/.*\/settings/);
    
    // Check for settings page elements
    await expect(page.locator('h1, h2').filter({ hasText: /settings|preferences|configuration/i })).toBeVisible();
  });

  test('should display settings sections', async ({ page }) => {
    await expect(page).toHaveURL(/.*\/settings/);
    
    // Look for common settings sections
    const settingsSections = [
      page.locator('text=Account'),
      page.locator('text=Privacy'),
      page.locator('text=Security'),
      page.locator('text=Notifications'),
      page.locator('text=Preferences'),
      page.locator('text=Theme'),
      page.locator('[data-testid*="settings"]')
    ];

    // At least one settings section should be visible
    let foundSettingsSection = false;
    for (const section of settingsSections) {
      if (await section.count() > 0) {
        foundSettingsSection = true;
        break;
      }
    }
    expect(foundSettingsSection).toBeTruthy();
  });

  test('should have navigation accessible', async ({ page }) => {
    await expect(page).toHaveURL(/.*\/settings/);
    
    // Check navigation is present
    await expect(page.locator('nav')).toBeVisible();
    
    // Should be able to navigate back to apps
    const appsLink = page.locator('a[href="/apps"], a').filter({ hasText: /apps|dashboard/i });
    if (await appsLink.count() > 0) {
      await expect(appsLink.first()).toBeVisible();
    }
  });

  test('should handle theme switching if available', async ({ page }) => {
    await expect(page).toHaveURL(/.*\/settings/);
    
    // Look for theme toggle/selector
    const themeToggle = page.locator('[data-testid="theme-toggle"], button').filter({ hasText: /dark|light|theme/i });
    const themeSelect = page.locator('select').filter({ hasText: /theme/i });
    
    if (await themeToggle.count() > 0) {
      await expect(themeToggle.first()).toBeVisible();
      // Test theme toggle
      await themeToggle.first().click();
      await page.waitForTimeout(1000);
    } else if (await themeSelect.count() > 0) {
      await expect(themeSelect.first()).toBeVisible();
    }
  });
  test('should handle form submissions if present', async ({ page }) => {
    await expect(page).toHaveURL(/.*\/settings/);
    
    // Look for forms and save buttons
    const forms = page.locator('form');
    const saveButtons = page.locator('button').filter({ hasText: /save|update|apply/i });
    
    if (await forms.count() > 0) {
      await expect(forms.first()).toBeVisible();
      
      if (await saveButtons.count() > 0) {
        await expect(saveButtons.first()).toBeVisible();
          // Test form submission (without actually changing data)
        await saveButtons.first().click();
        await page.waitForTimeout(2000);
        
        // Look for success message or feedback (optional)
        const successMessage = page.locator('text=saved, text=updated, [data-testid*="success"]');
        if (await successMessage.count() > 0) {
          await expect(successMessage.first()).toBeVisible();
        }
      }
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page).toHaveURL(/.*\/settings/);
    
    // Check mobile responsiveness
    await expect(page.locator('nav')).toBeVisible();
    
    // Settings should still be accessible on mobile
    const settingsContent = page.locator('main, [role="main"], .settings');
    if (await settingsContent.count() > 0) {
      await expect(settingsContent.first()).toBeVisible();
    }
  });
});
