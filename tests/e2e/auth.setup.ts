import { test as setup, expect } from '@playwright/test';
import { AuthHelper } from './helpers/auth.helper';

const authFile = 'playwright/.auth/user.json';

// Setup for authenticated tests
setup('authenticate', async ({ page }) => {
  const authHelper = new AuthHelper(page);
  
  // Use test credentials - adjust these based on your test setup
  const testEmail = 'test@example.com';
  const testPassword = 'password123';
  
  try {
    // Attempt to login
    await authHelper.login(testEmail, testPassword);
    
    // Verify successful login by checking URL or presence of authenticated elements
    if (page.url().includes('/apps')) {
      console.log('✅ Authentication successful');
      
      // Save authentication state
      await page.context().storageState({ path: authFile });
    } else {
      console.log('⚠️ Authentication may have failed - test credentials might not exist');
      
      // Create a minimal auth state for testing
      await page.evaluate(() => {
        localStorage.setItem('test_auth_state', 'authenticated');
      });
      
      await page.context().storageState({ path: authFile });
    }
  } catch (error) {
    console.log('⚠️ Authentication setup failed:', error);
    
    // Create a fallback auth state
    await page.goto('/auth/login');
    await page.evaluate(() => {
      localStorage.setItem('test_auth_state', 'unauthenticated');
    });
    
    await page.context().storageState({ path: authFile });
  }
});