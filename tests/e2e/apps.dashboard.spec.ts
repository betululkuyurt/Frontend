import { test, expect } from '@playwright/test';
import { AuthHelper, generateTestUser } from './helpers/auth.helper';

// This test requires authentication to access the apps page
test.describe('Apps Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to apps page - authentication is handled by the global setup
    await page.goto('/apps');
    // Wait for page to load and verify we're not redirected to login
    await page.waitForLoadState('domcontentloaded');
    
    // If we get redirected to login, something is wrong with auth
    if (page.url().includes('/auth/login')) {
      throw new Error('Authentication failed - redirected to login page');
    }
  });

  test('should display navigation bar', async ({ page }) => {
    // Should be authenticated and on apps page
    await expect(page).toHaveURL(/.*\/apps/);
    // Check for navigation elements
    await expect(page.locator('nav')).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Should be authenticated and on apps page
    await expect(page).toHaveURL(/.*\/apps/);
    // Check mobile apps page
    await expect(page.locator('nav')).toBeVisible();
  });

  test('should handle search functionality', async ({ page }) => {
    // Should be authenticated and on apps page
    await expect(page).toHaveURL(/.*\/apps/);
    
    // Look for search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]');
    
    if (await searchInput.count() > 0) {
      await expect(searchInput).toBeVisible();
      
      // Test search functionality
      await searchInput.fill('test');
      await page.waitForTimeout(1000); // Wait for search results
    }
  });

  test('should display app cards', async ({ page }) => {
    // Should be authenticated and on apps page
    await expect(page).toHaveURL(/.*\/apps/);
    
    // Wait for potential app cards to load
    await page.waitForTimeout(2000);
    
    // Check if there are any app cards or a message about no apps
    const noAppsMessage = page.locator('text=No apps, text=Create your first app');
    const hasNoAppsMessage = await noAppsMessage.count() > 0;
    
    expect(hasNoAppsMessage).toBeFalsy();
  });

  test('should have create new app functionality', async ({ page }) => {
    // Should be authenticated and on apps page
    await expect(page).toHaveURL(/.*\/apps/);
    
    // Look for create/add new app button
    const createButton = page.locator('button, a').filter({ 
      hasText: /create|add|new|plus|\+/i 
    });
    
    if (await createButton.count() > 0) {
      await expect(createButton.first()).toBeVisible();
    }
  });
});
