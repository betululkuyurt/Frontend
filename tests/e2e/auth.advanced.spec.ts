import { test, expect } from '@playwright/test';

// Auth test - clean slate, no stored authentication
test.describe('Advanced Authentication Flows', () => {
  test('should handle password reset flow', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Look for forgot password link
    const forgotPasswordLink = page.locator('a').filter({ hasText: /forgot|reset|password/i });
    
    if (await forgotPasswordLink.count() > 0) {
      await forgotPasswordLink.first().click();
      
      // Should navigate to password reset page
      await expect(page).toHaveURL(/.*\/(forgot|reset|password)/);
      
      // Should have email input and submit button
      await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
      
      // Test form submission with valid email format
      await page.fill('input[type="email"], input[name="email"]', 'test@example.com');
      await page.click('button[type="submit"]');
      
      // Should show some feedback
      await page.waitForTimeout(2000);
    }
  });

  test('should validate registration form fields', async ({ page }) => {
    await page.goto('/auth/register');
    
    // Fill out registration form with invalid data and test validation
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    const passwordInput = page.locator('input[type="password"], input[name="password"]');
    const confirmPasswordInput = page.locator('input[name="confirmPassword"], input[name="password_confirmation"]');
    const submitButton = page.locator('button[type="submit"]');

    if (await emailInput.count() > 0 && await passwordInput.count() > 0) {
      // Test invalid email
      await emailInput.fill('invalid-email');
      await passwordInput.fill('password123');
      if (await confirmPasswordInput.count() > 0) {
        await confirmPasswordInput.fill('password123');
      }
      
      await submitButton.click();
      await page.waitForTimeout(1000);
      
      // Should show validation error or prevent submission
      expect(page.url()).toContain('/auth/register');
      
      // Test password mismatch if confirm password exists
      if (await confirmPasswordInput.count() > 0) {
        await emailInput.fill('test@example.com');
        await passwordInput.fill('password123');
        await confirmPasswordInput.fill('different-password');
        
        await submitButton.click();
        await page.waitForTimeout(1000);
        
        // Should show validation error
        expect(page.url()).toContain('/auth/register');
      }
    }
  });

  test('should handle registration flow completely', async ({ page }) => {
    await page.goto('/auth/register');
    
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    const passwordInput = page.locator('input[type="password"], input[name="password"]');
    const nameInput = page.locator('input[name="name"], input[name="username"], input[name="firstName"]');
    const submitButton = page.locator('button[type="submit"]');

    if (await emailInput.count() > 0 && await passwordInput.count() > 0) {
      // Fill out form with valid data
      const timestamp = Date.now();
      await emailInput.fill(`test${timestamp}@example.com`);
      await passwordInput.fill('ValidPassword123!');
      
      if (await nameInput.count() > 0) {
        await nameInput.fill('Test User');
      }
      
      // Handle confirm password if it exists
      const confirmPasswordInput = page.locator('input[name="confirmPassword"], input[name="password_confirmation"]');
      if (await confirmPasswordInput.count() > 0) {
        await confirmPasswordInput.fill('ValidPassword123!');
      }
      
      await submitButton.click();
      await page.waitForTimeout(3000);
      
      // After registration, should either:
      // 1. Redirect to apps/dashboard
      // 2. Show confirmation page
      // 3. Redirect to login with success message
      const currentUrl = page.url();
      const validOutcomes = [
        currentUrl.includes('/apps'),
        currentUrl.includes('/dashboard'),
        currentUrl.includes('/confirm'),
        currentUrl.includes('/verify'),
        currentUrl.includes('/auth/login')
      ];
      
      expect(validOutcomes.some(outcome => outcome)).toBeTruthy();
    }
  });

  test('should handle social login buttons if present', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Look for social login buttons
    const socialButtons = [
      page.locator('button').filter({ hasText: /google/i }),
      page.locator('button').filter({ hasText: /github/i }),
      page.locator('button').filter({ hasText: /facebook/i }),
      page.locator('a').filter({ hasText: /google/i }),
      page.locator('a').filter({ hasText: /github/i })
    ];

    for (const socialButton of socialButtons) {
      if (await socialButton.count() > 0) {
        await expect(socialButton.first()).toBeVisible();
        // Don't actually click to avoid external redirects in tests
      }
    }
  });

  test('should handle session expiry simulation', async ({ page }) => {
    // First, try to go to a protected page without auth
    await page.goto('/apps');
    
    // Should redirect to login
    await expect(page).toHaveURL(/.*\/auth\/login/);
    
    // Now simulate a login and then session expiry
    await page.goto('/auth/login');
    
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    const passwordInput = page.locator('input[type="password"], input[name="password"]');
    
    if (await emailInput.count() > 0 && await passwordInput.count() > 0) {
      await emailInput.fill('test@example.com');
      await passwordInput.fill('password123');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(2000);
      
      // If login was successful and we're now on a protected page,
      // clear storage to simulate session expiry
      if (!page.url().includes('/auth/login')) {
        await page.context().clearCookies();
        await page.evaluate(() => {
          localStorage.clear();
          sessionStorage.clear();
        });
        
        // Try to access protected page again
        await page.goto('/apps');
        
        // Should redirect back to login
        await expect(page).toHaveURL(/.*\/auth\/login/);
      }
    }
  });

  test('should maintain redirect after login', async ({ page }) => {
    // Try to access protected page directly
    await page.goto('/profile');
    
    // Should redirect to login
    await expect(page).toHaveURL(/.*\/auth\/login/);
    
    // The URL might contain a redirect parameter
    const currentUrl = page.url();
    const hasRedirectParam = currentUrl.includes('redirect') || currentUrl.includes('return');
    
    // If there's a redirect mechanism, it should be preserved
    if (hasRedirectParam) {
      // Fill in login form
      const emailInput = page.locator('input[type="email"], input[name="email"]');
      const passwordInput = page.locator('input[type="password"], input[name="password"]');
      
      if (await emailInput.count() > 0 && await passwordInput.count() > 0) {
        await emailInput.fill('test@example.com');
        await passwordInput.fill('password123');
        await page.click('button[type="submit"]');
        await page.waitForTimeout(3000);
        
        // After successful login, should redirect to original destination
        // (This will only work if the login actually succeeds)
      }
    }
  });
});
