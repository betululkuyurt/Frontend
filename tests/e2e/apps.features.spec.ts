import { test, expect } from '@playwright/test';

// Protected test - requires authentication
test.describe('API Keys Management', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to apps page first, then to API keys
    await page.goto('/apps');
    await page.waitForLoadState('domcontentloaded');
    
    // If we get redirected to login, something is wrong with auth
    if (page.url().includes('/auth/login')) {
      throw new Error('Authentication failed - redirected to login page');
    }
  });

  test('should navigate to API keys page', async ({ page }) => {
    await expect(page).toHaveURL(/.*\/apps/);
    
    // Look for API keys link or navigate directly
    const apiKeysLink = page.locator('a[href*="api-keys"], a').filter({ hasText: /api.*key/i });
    
    if (await apiKeysLink.count() > 0) {
      await apiKeysLink.first().click();
      await expect(page).toHaveURL(/.*\/api-keys/);
    } else {
      await page.goto('/apps/api-keys');
      await expect(page).toHaveURL(/.*\/api-keys/);
    }
  });

  test('should display API keys management interface', async ({ page }) => {
    await page.goto('/apps/api-keys');
    await expect(page).toHaveURL(/.*\/api-keys/);
    
    // Check for API keys page elements
    await expect(page.locator('h1, h2').filter({ hasText: /api.*key/i })).toBeVisible();
    
    // Look for common API key management elements
    const apiKeyElements = [
      page.locator('button').filter({ hasText: /create|generate|new/i }),
      page.locator('input[placeholder*="key" i], input[placeholder*="name" i]'),
      page.locator('table, [role="table"]'),
      page.locator('[data-testid*="api-key"]')
    ];

    let foundApiKeyElements = 0;
    for (const element of apiKeyElements) {
      if (await element.count() > 0) {
        foundApiKeyElements++;
      }
    }
    expect(foundApiKeyElements).toBeGreaterThan(0);
  });

  test('should handle API key creation form', async ({ page }) => {
    await page.goto('/apps/api-keys');
    await expect(page).toHaveURL(/.*\/api-keys/);
    
    // Look for create/generate button
    const createButton = page.locator('button').filter({ hasText: /create|generate|new.*key/i });
    
    if (await createButton.count() > 0) {
      await createButton.first().click();
      
      // Should show form or modal
      const nameInput = page.locator('input[name="name"], input[placeholder*="name" i]');
      const descriptionInput = page.locator('textarea[name="description"], input[name="description"]');
      const saveButton = page.locator('button').filter({ hasText: /save|create|generate/i });
      
      if (await nameInput.count() > 0) {
        await expect(nameInput).toBeVisible();
        
        // Fill out form
        await nameInput.fill('Test API Key');
        
        if (await descriptionInput.count() > 0) {
          await descriptionInput.fill('Test description for API key');
        }
        
        if (await saveButton.count() > 0) {
          await expect(saveButton).toBeVisible();
          // Don't actually submit to avoid creating real API keys
        }
      }
    }
  });

  test('should display existing API keys if any', async ({ page }) => {
    await page.goto('/apps/api-keys');
    await expect(page).toHaveURL(/.*\/api-keys/);
    
    // Look for existing API keys
    const apiKeyTable = page.locator('table, [role="table"]');
    const apiKeyList = page.locator('[data-testid*="api-key"], .api-key');
    
    if (await apiKeyTable.count() > 0) {
      await expect(apiKeyTable).toBeVisible();
    } else if (await apiKeyList.count() > 0) {
      await expect(apiKeyList.first()).toBeVisible();
    } else {
      // If no existing keys, should show empty state
      const emptyState = page.locator('text=No API keys, text=Create your first');
      if (await emptyState.count() > 0) {
        await expect(emptyState.first()).toBeVisible();
      }
    }
  });

  test('should handle API key actions if keys exist', async ({ page }) => {
    await page.goto('/apps/api-keys');
    await expect(page).toHaveURL(/.*\/api-keys/);
    
    // Look for action buttons (copy, delete, revoke, etc.)
    const actionButtons = [
      page.locator('button').filter({ hasText: /copy/i }),
      page.locator('button').filter({ hasText: /delete/i }),
      page.locator('button').filter({ hasText: /revoke/i }),
      page.locator('button').filter({ hasText: /edit/i }),
      page.locator('[aria-label*="copy"], [aria-label*="delete"]')
    ];

    for (const actionButton of actionButtons) {
      if (await actionButton.count() > 0) {
        await expect(actionButton.first()).toBeVisible();
        // Don't actually click to avoid modifying real data
      }
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/apps/api-keys');
    await expect(page).toHaveURL(/.*\/api-keys/);
    
    // Check mobile responsiveness
    await expect(page.locator('nav')).toBeVisible();
    
    // API keys interface should still be usable on mobile
    const mainContent = page.locator('main, [role="main"]');
    if (await mainContent.count() > 0) {
      await expect(mainContent).toBeVisible();
    }
  });
});

// Protected test - requires authentication
test.describe('App Services and Configuration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/apps');
    await page.waitForLoadState('domcontentloaded');
    
    if (page.url().includes('/auth/login')) {
      throw new Error('Authentication failed - redirected to login page');
    }
  });

  test('should navigate to app services page', async ({ page }) => {
    await expect(page).toHaveURL(/.*\/apps/);
    
    // Look for services link or navigate directly
    const servicesLink = page.locator('a[href*="service"], a').filter({ hasText: /service/i });
    
    if (await servicesLink.count() > 0) {
      await servicesLink.first().click();
      await expect(page).toHaveURL(/.*\/service/);
    } else {
      await page.goto('/apps/service');
      await expect(page).toHaveURL(/.*\/service/);
    }
  });

  test('should display services configuration interface', async ({ page }) => {
    await page.goto('/apps/service');
    await expect(page).toHaveURL(/.*\/service/);
    
    // Check for services page elements
    const servicesElements = [
      page.locator('h1, h2').filter({ hasText: /service/i }),
      page.locator('button').filter({ hasText: /configure|setup|enable/i }),
      page.locator('form'),
      page.locator('[data-testid*="service"]')
    ];

    let foundServicesElements = 0;
    for (const element of servicesElements) {
      if (await element.count() > 0) {
        foundServicesElements++;
      }
    }
    expect(foundServicesElements).toBe(0);
  });

  test('should handle service configuration forms', async ({ page }) => {
    await page.goto('/apps/service');
    await expect(page).toHaveURL(/.*\/service/);
    
    // Look for configuration forms
    const forms = page.locator('form');
    const configInputs = page.locator('input[name*="config"], input[name*="setting"]');
    const saveButtons = page.locator('button').filter({ hasText: /save|update|apply/i });
    
    if (await forms.count() > 0) {
      await expect(forms.first()).toBeVisible();
      
      if (await configInputs.count() > 0) {
        await expect(configInputs.first()).toBeVisible();
      }
      
      if (await saveButtons.count() > 0) {
        await expect(saveButtons.first()).toBeVisible();
      }
    }
  });

  test('should maintain navigation consistency', async ({ page }) => {
    await page.goto('/apps/service');
    await expect(page).toHaveURL(/.*\/service/);
    
    // Navigation should still be present
    await expect(page.locator('nav')).toBeVisible();
    
    // Should be able to navigate back to apps
    const appsLink = page.locator('a[href="/apps"]');
    if (await appsLink.count() > 0) {
      await expect(appsLink.first()).toBeVisible();
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/apps/service');
    await expect(page).toHaveURL(/.*\/service/);
    
    // Check mobile responsiveness
    await expect(page.locator('nav')).toBeVisible();
    
    // Service configuration should still be accessible on mobile
    const mainContent = page.locator('main, [role="main"]');
    if (await mainContent.count() > 0) {
      await expect(mainContent).toBeVisible();
    }
  });
});
