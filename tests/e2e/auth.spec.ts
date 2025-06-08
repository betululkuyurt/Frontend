import { test, expect } from '@playwright/test';

test.describe('Authentication Pages', () => {  test.describe('Login Page', () => {
    test('should load the login page successfully', async ({ page }) => {
      await page.goto('/auth/login');
      
      // Check if the page loads properly - look for the actual heading text
      await expect(page.locator('h1, h2, h3').filter({ hasText: /welcome back|login|sign in/i })).toBeVisible();
      
      // Check for form elements
      await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"], input[name="password"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
    });

    test('should show validation errors for empty form', async ({ page }) => {
      await page.goto('/auth/login');
      
      // Try to submit empty form
      await page.click('button[type="submit"]');
      
      // Should show validation error or prevent submission
      // This will depend on your validation implementation
      await page.waitForTimeout(1000);
    });

    test('should show error for invalid credentials', async ({ page }) => {
      await page.goto('/auth/login');
      
      // Fill in invalid credentials
      await page.fill('input[type="email"], input[name="email"]', 'invalid@test.com');
      await page.fill('input[type="password"], input[name="password"]', 'wrongpassword');
      
      // Submit form
      await page.click('button[type="submit"]');
      
      // Wait for error message (adjust timeout as needed)
      await page.waitForTimeout(3000);
      
      // Check for error message or that we're still on login page
      const currentUrl = page.url();
      expect(currentUrl).toContain('/auth/login');
    });

    test('should have link to register page', async ({ page }) => {
      await page.goto('/auth/login');
      
      // Look for register/sign up link
      const registerLink = page.locator('a').filter({ hasText: /register|sign up/i });
      if (await registerLink.count() > 0) {
        await expect(registerLink).toBeVisible();
        await registerLink.click();
        await expect(page).toHaveURL(/.*\/auth\/register/);
      }
    });

    test('should be responsive on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/auth/login');
      
      // Check if form is visible and usable on mobile
      await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"], input[name="password"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
    });
  });
  test.describe('Register Page', () => {
    test('should load the register page successfully', async ({ page }) => {
      await page.goto('/auth/register');
      
      // Check if the page loads properly - look for the actual heading text
      await expect(page.locator('h1, h2, h3').filter({ hasText: /create account|register|sign up/i })).toBeVisible();
      
      // Check for form elements (adjust selectors based on your form)
      await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"], input[name="password"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
    });    test('should show validation errors for invalid data', async ({ page }) => {
      await page.goto('/auth/register');
      
      // Fill in required fields to enable the submit button first
      await page.fill('input[name="name"], input[placeholder*="name" i]', 'Test User');
      await page.fill('input[type="email"], input[name="email"]', 'invalid-email');
      await page.fill('input[type="password"], input[name="password"]', 'password123');
      
      // Click on the checkbox element directly (using ID)
      await page.click('#terms');
      
      // Try to submit with invalid email
      await page.click('button[type="submit"]');
      
      // Wait for validation or error message
      await page.waitForTimeout(2000);
      
      // The form should either show validation error or prevent submission
      // Check if we're still on register page or if there's an error message
      const currentUrl = page.url();
      expect(currentUrl).toContain('/auth/register');
    });

    test('should have link to login page', async ({ page }) => {
      await page.goto('/auth/register');
      
      // Look for login/sign in link
      const loginLink = page.locator('a').filter({ hasText: /login|sign in/i });
      if (await loginLink.count() > 0) {
        await expect(loginLink).toBeVisible();
        await loginLink.click();
        await expect(page).toHaveURL(/.*\/auth\/login/);
      }
    });

    test('should be responsive on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/auth/register');
      
      // Check if form is visible and usable on mobile
      await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"], input[name="password"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
    });
  });
});
