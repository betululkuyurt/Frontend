import { Page, expect } from '@playwright/test';

/**
 * Authentication helper utilities for Playwright tests
 */

export class AuthHelper {
  constructor(private page: Page) {}
  /**
   * Login with email and password
   */
  async login(email: string, password: string) {
    await this.page.goto('/auth/login');
    
    // Wait for the page to load
    await this.page.waitForSelector('input[type="email"], input[name="email"]');
    
    await this.page.fill('input[type="email"], input[name="email"]', email);
    await this.page.fill('input[type="password"], input[name="password"]', password);
    
    // Click submit and wait for navigation
    await Promise.all([
      this.page.waitForURL('**/apps', { timeout: 10000 }),
      this.page.click('button[type="submit"]')
    ]);
  }

  /**
   * Register a new user
   */
  async register(email: string, password: string, username?: string) {
    await this.page.goto('/auth/register');
    
    if (username) {
      const usernameInput = this.page.locator('input[name="username"], input[placeholder*="username" i]');
      if (await usernameInput.count() > 0) {
        await usernameInput.fill(username);
      }
    }
    
    await this.page.fill('input[type="email"], input[name="email"]', email);
    await this.page.fill('input[type="password"], input[name="password"]', password);
    
    // Handle confirm password field if it exists
    const confirmPasswordInput = this.page.locator('input[name="confirmPassword"], input[name="password_confirmation"]');
    if (await confirmPasswordInput.count() > 0) {
      await confirmPasswordInput.fill(password);
    }
    
    await this.page.click('button[type="submit"]');
    
    // Wait for navigation or success indicator
    await this.page.waitForTimeout(2000);
  }

  /**
   * Check if user is logged in
   */
  async isLoggedIn(): Promise<boolean> {
    // Try to go to a protected page
    await this.page.goto('/apps');
    
    // If redirected to login, user is not logged in
    return !this.page.url().includes('/auth/login');
  }

  /**
   * Logout user
   */
  async logout() {
    // Look for logout button/link
    const logoutButton = this.page.locator('button, a').filter({ hasText: /logout|sign out/i });
    
    if (await logoutButton.count() > 0) {
      await logoutButton.click();
      await this.page.waitForTimeout(1000);
    } else {
      // If no logout button, clear cookies/localStorage
      await this.page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
      
      // Clear cookies
      const context = this.page.context();
      await context.clearCookies();
    }
  }

  /**
   * Set up authentication state programmatically
   * Use this to bypass login forms in tests
   */
  async setupAuthState(token: string) {
    await this.page.goto('/');
    
    // Set authentication token in localStorage/cookies
    await this.page.evaluate((authToken) => {
      localStorage.setItem('access_token', authToken);
      localStorage.setItem('refresh_token', authToken);
    }, token);
    
    // Set cookies if needed
    await this.page.context().addCookies([
      {
        name: 'access_token',
        value: token,
        domain: 'localhost',
        path: '/',
      }
    ]);
  }
}

/**
 * Generate test user data
 */
export function generateTestUser() {
  const timestamp = Date.now();
  return {
    email: `test${timestamp}@example.com`,
    password: 'Test123!@#',
    username: `testuser${timestamp}`,
  };
}

/**
 * Wait for element with timeout
 */
export async function waitForElement(page: Page, selector: string, timeout = 5000) {
  try {
    await page.waitForSelector(selector, { timeout });
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if page has loaded completely
 */
export async function waitForPageLoad(page: Page) {
  await page.waitForLoadState('networkidle');
  
  // Wait for any loading spinners to disappear
  const loadingSpinners = page.locator('[data-testid="loading"], .loading, .spinner');
  if (await loadingSpinners.count() > 0) {
    await loadingSpinners.first().waitFor({ state: 'hidden', timeout: 10000 });
  }
}
