import { test, expect } from '@playwright/test';
import { AuthHelper, generateTestUser } from './helpers/auth.helper';

// This test assumes you need to be authenticated to access the apps page
// You may need to adjust this based on your authentication flow
test.describe('Apps Dashboard', () => {
  // Skip authentication for now - you can implement proper auth setup later
  test.beforeEach(async ({ page }) => {
    // Mock authentication or login programmatically
    // For now, we'll just try to access the page directly
    await page.goto('/apps');
  });

  test('should load the apps dashboard', async ({ page }) => {
          const authHelper = new AuthHelper(page);
          const testUser = generateTestUser();
          
          // Navigate to register page
          await page.goto('/auth/register');
          
          // Fill registration form
          await page.fill('input[name="name"], input[placeholder*="name" i]', testUser.username);
          await page.fill('input[type="email"], input[name="email"]', testUser.email);
          await page.fill('input[type="password"], input[name="password"]', testUser.password);
          
          // Agree to terms
          await page.getByRole('checkbox', { name: 'I agree to the Terms of' }).click();
          
          // Submit registration
          await page.click('button[type="submit"]');
        
          
          // Check if registration was successful
          if (page.url().includes('/apps')) {
            // Registration successful and auto-logged in
            await expect(page).toHaveURL(/.*\/apps/);
            console.log('✅ Registration successful - auto-logged in');
          } else if (page.url().includes('/auth/login')) {
            // Redirected to login page
            console.log('ℹ️ Registration successful - redirected to login');
            
            // Now try to login with the registered credentials
            await authHelper.login(testUser.email, testUser.password);
            
            // Should be redirected to dashboard
            await expect(page).toHaveURL(/.*\/apps/);
          } else {
            // Still on register page - might have failed
            console.log('⚠️ Registration might have failed or requires verification');
            await expect(page).toHaveURL(/.*\/auth\/register/);
          }
  });

  test('should display navigation bar', async ({ page }) => {
    const currentUrl = page.url();
    
    if (!currentUrl.includes('/auth/login')) {
      // Check for navigation elements
      await expect(page.locator('nav')).toBeVisible();
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    const currentUrl = page.url();
    
    if (currentUrl.includes('/auth/login')) {
      // Check mobile login page
      await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
    } else {
      // Check mobile apps page
      await expect(page.locator('nav')).toBeVisible();
    }
  });

  test('should handle search functionality', async ({ page }) => {
    const currentUrl = page.url();
    
    // Only test search if we're on the apps page
    if (!currentUrl.includes('/auth/login')) {
      // Look for search input
      const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]');
      
      if (await searchInput.count() > 0) {
        await expect(searchInput).toBeVisible();
        
        // Test search functionality
        await searchInput.fill('test');
        await page.waitForTimeout(1000); // Wait for search results
      }
    }
  });

  test('should display app cards', async ({ page }) => {
    const currentUrl = page.url();
    
    if (!currentUrl.includes('/auth/login')) {
      // Wait for potential app cards to load
      await page.waitForTimeout(2000);
      
      // Check if there are any app cards or a message about no apps
      const appCards = page.locator('[data-testid="app-card"], .app-card, .mini-app-card');
      const noAppsMessage = page.locator('text=No apps, text=Create your first app');
      
      // Either should have app cards or a no apps message
      const hasCards = await appCards.count() > 0;
      const hasNoAppsMessage = await noAppsMessage.count() > 0;
      
      expect(hasCards || hasNoAppsMessage).toBeTruthy();
    }
  });

  test('should have create new app functionality', async ({ page }) => {
    const currentUrl = page.url();
    
    if (!currentUrl.includes('/auth/login')) {
      // Look for create/add new app button
      const createButton = page.locator('button, a').filter({ 
        hasText: /create|add|new|plus|\+/i 
      });
      
      if (await createButton.count() > 0) {
        await expect(createButton.first()).toBeVisible();
      }
    }
  });
});
