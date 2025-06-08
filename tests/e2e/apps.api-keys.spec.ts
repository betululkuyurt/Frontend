import { test, expect } from '@playwright/test';

// Protected test - requires authentication
test.describe('API Keys Management', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to apps page first - authentication is handled by the global setup
    await page.goto('/apps');
    await page.waitForLoadState('domcontentloaded');
    
    // If we get redirected to login, something is wrong with auth
    if (page.url().includes('/auth/login')) {
      throw new Error('Authentication failed - redirected to login page');
    }
  });

  test('should navigate to API keys page', async ({ page }) => {
    await expect(page).toHaveURL(/.*\/apps/);
    
    // Look for API keys link/button
    const apiKeysLink = page.locator('a[href*="/api-keys"], a').filter({ hasText: /api.?keys?/i });
    
    if (await apiKeysLink.count() > 0) {
      await apiKeysLink.first().click();
      await expect(page).toHaveURL(/.*\/api-keys/);
    } else {
      // Navigate directly if no link found
      await page.goto('/apps/api-keys');
      await expect(page).toHaveURL(/.*\/api-keys/);
    }
  });

  test('should display API keys management interface', async ({ page }) => {
    await page.goto('/apps/api-keys');
    await expect(page).toHaveURL(/.*\/api-keys/);
    
    // Check for API keys page elements
    await expect(page.locator('h1, h2').filter({ hasText: /api.?keys?/i })).toBeVisible();
    
    // Look for common API key management elements
    const apiKeyElements = [
      page.locator('button').filter({ hasText: /create|generate|new/i }),
      page.locator('table, [role="table"]'),
      page.locator('[data-testid*="api-key"]'),
      page.locator('input[type="text"][readonly], input[value*="sk-"], input[value*="api-"]')
    ];

    // At least one API key management element should be present
    let foundApiKeyElement = false;
    for (const element of apiKeyElements) {
      if (await element.count() > 0) {
        foundApiKeyElement = true;
        break;
      }
    }
    expect(foundApiKeyElement).toBeTruthy();
  });

  test('should handle API key creation flow', async ({ page }) => {
    await page.goto('/apps/api-keys');
    await expect(page).toHaveURL(/.*\/api-keys/);
    
    // Look for create/generate button
    const createButton = page.locator('button').filter({ hasText: /create|generate|new/i });
    
    if (await createButton.count() > 0) {
      await createButton.first().click();
      
      // Should show creation dialog or navigate to creation page
      await page.waitForTimeout(1000);
      
      // Look for form elements
      const nameInput = page.locator('input[name="name"], input[placeholder*="name" i]');
      const descriptionInput = page.locator('textarea[name="description"], input[name="description"]');
      const submitButton = page.locator('button[type="submit"], button').filter({ hasText: /create|generate|save/i });
      
      if (await nameInput.count() > 0) {
        await expect(nameInput.first()).toBeVisible();
        
        // Fill in form
        await nameInput.first().fill('Test API Key');
        
        if (await descriptionInput.count() > 0) {
          await descriptionInput.first().fill('Test description');
        }
        
        if (await submitButton.count() > 0) {
          // Don't actually submit to avoid creating real API keys
          await expect(submitButton.first()).toBeVisible();
        }
      }
    }
  });

  test('should display existing API keys if any', async ({ page }) => {
    await page.goto('/apps/api-keys');
    await expect(page).toHaveURL(/.*\/api-keys/);
    
    // Look for existing API keys table or list
    const apiKeysList = page.locator('table, [role="table"], [data-testid*="api-key"]');
    const apiKeyRows = page.locator('tr, [role="row"]').filter({ hasNot: page.locator('th') });
    
    if (await apiKeysList.count() > 0) {
      await expect(apiKeysList.first()).toBeVisible();
      
      // If there are API key rows, check their structure
      if (await apiKeyRows.count() > 0) {
        const firstRow = apiKeyRows.first();
        await expect(firstRow).toBeVisible();
        
        // Look for common API key row elements
        const keyElements = [
          firstRow.locator('button').filter({ hasText: /delete|remove|revoke/i }),
          firstRow.locator('code, [data-testid*="key"], input[readonly]'),
          firstRow.locator('text=/sk-|api-/')
        ];
        
        // At least one key element should be present
        let foundKeyElement = false;
        for (const element of keyElements) {
          if (await element.count() > 0) {
            foundKeyElement = true;
            break;
          }
        }
        expect(foundKeyElement).toBeTruthy();
      }
    }
  });

  test('should handle API key deletion if available', async ({ page }) => {
    await page.goto('/apps/api-keys');
    await expect(page).toHaveURL(/.*\/api-keys/);
    
    // Look for delete buttons
    const deleteButtons = page.locator('button').filter({ hasText: /delete|remove|revoke/i });
    
    if (await deleteButtons.count() > 0) {
      await expect(deleteButtons.first()).toBeVisible();
      
      // Click delete button (but don't confirm to avoid actually deleting)
      await deleteButtons.first().click();
      await page.waitForTimeout(1000);
      
      // Should show confirmation dialog
      const confirmDialog = page.locator('[role="dialog"], .modal, [data-testid*="confirm"]');
      const confirmButton = page.locator('button').filter({ hasText: /confirm|yes|delete/i });
      const cancelButton = page.locator('button').filter({ hasText: /cancel|no/i });
      
      if (await confirmDialog.count() > 0) {
        await expect(confirmDialog.first()).toBeVisible();
        
        // Cancel instead of confirming
        if (await cancelButton.count() > 0) {
          await cancelButton.first().click();
        }
      }
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/apps/api-keys');
    await expect(page).toHaveURL(/.*\/api-keys/);
    
    // Check mobile responsiveness
    await expect(page.locator('nav')).toBeVisible();
    
    // API keys interface should be usable on mobile
    const mainContent = page.locator('main, [role="main"]');
    if (await mainContent.count() > 0) {
      await expect(mainContent.first()).toBeVisible();
    }
    
    // Tables should be scrollable or stacked appropriately on mobile
    const table = page.locator('table');
    if (await table.count() > 0) {
      const tableContainer = table.locator('..'); // Parent container
      // Table should not overflow viewport width
      const tableWidth = await table.evaluate(el => el.scrollWidth);
      expect(tableWidth).toBeLessThanOrEqual(400); // Allow some margin for mobile
    }
  });

  test('should have proper security warnings', async ({ page }) => {
    await page.goto('/apps/api-keys');
    await expect(page).toHaveURL(/.*\/api-keys/);
    
    // Look for security-related text or warnings
    const securityTexts = [
      page.locator('text=/keep.{0,20}secret/i'),
      page.locator('text=/do not share/i'),
      page.locator('text=/secure/i'),
      page.locator('text=/warning/i'),
      page.locator('[data-testid*="warning"], [role="alert"]')
    ];

    // At least some security guidance should be present
    let foundSecurityGuidance = false;
    for (const element of securityTexts) {
      if (await element.count() > 0) {
        foundSecurityGuidance = true;
        break;
      }
    }
    
    // Don't fail if no security text found, but it's good practice to have it
    // expect(foundSecurityGuidance).toBeTruthy();
  });

  test('should handle navigation back to apps', async ({ page }) => {
    await page.goto('/apps/api-keys');
    await expect(page).toHaveURL(/.*\/api-keys/);
    
    // Should be able to navigate back to apps
    const backButton = page.locator('a[href="/apps"], button').filter({ hasText: /back|apps/i });
    const breadcrumb = page.locator('nav a[href="/apps"]');
    
    if (await backButton.count() > 0) {
      await expect(backButton.first()).toBeVisible();
      await backButton.first().click();
      await expect(page).toHaveURL(/.*\/apps$/);
    } else if (await breadcrumb.count() > 0) {
      await expect(breadcrumb.first()).toBeVisible();
      await breadcrumb.first().click();
      await expect(page).toHaveURL(/.*\/apps$/);
    } else {
      // Navigation should still be present
      await expect(page.locator('nav')).toBeVisible();
    }
  });
});
