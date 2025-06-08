import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test('should load the landing page successfully', async ({ page }) => {
    await page.goto('/');
    
    // Check if the page loads properly
    await expect(page).toHaveTitle(/AI Super App/i);
    
    // Check for main navigation elements
    await expect(page.locator('text=Sign up')).toBeVisible();
    await expect(page.locator('text=Sign in')).toBeVisible();
  });


  test('should navigate to login page when Sign in is clicked', async ({ page }) => {
    await page.goto('/');
    
    // Click on Sign in button/link
    await page.click('text=Sign in');
    
    // Should navigate to login page
    await expect(page).toHaveURL(/.*\/auth\/login/);
  });

  test('should navigate to register page when Sign up is clicked', async ({ page }) => {
    await page.goto('/');
    
    // Click on Sign up button/link
    await page.click('text=Get started');
    
    // Should navigate to register page
    await expect(page).toHaveURL(/.*\/auth\/register/);
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Check if page loads on mobile
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('text=Sign up')).toBeVisible();
  });

  test('should have proper meta tags for SEO', async ({ page }) => {
    await page.goto('/');
    
    // Check for viewport meta tag
    const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
    expect(viewport).toContain('width=device-width');
  });
});
