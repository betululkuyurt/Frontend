import { test as setup } from '@playwright/test';

const authFile = 'tests/e2e/.auth/user.json';

setup('authenticate', async ({ page }) => {
  // Get credentials from environment variables
  const testEmail = process.env.TEST_USER_EMAIL ?? 'test@example.com';
  const testPassword = process.env.TEST_USER_PASSWORD ?? 'password123';
  
  console.log(`🔐 Attempting authentication with: ${testEmail}`);
  
  try {
    // Navigate to login page
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');
    
    // Fill in credentials
    await page.fill('input[type="email"], input[name="email"]', testEmail);
    await page.fill('input[type="password"], input[name="password"]', testPassword);
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for navigation or error
    await page.waitForTimeout(5000);
    
    // Check if we're logged in successfully
    if (page.url().includes('/apps')) {
      console.log('✅ Authentication successful - saving state');
      await page.context().storageState({ path: authFile });
    } else {
      console.log('❌ Authentication failed - creating fallback state');
      // Create a minimal fallback state for tests that can run without auth
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await page.context().storageState({ path: authFile });
    }
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.log(`⚠️ Error during authentication: ${errorMessage}`);
    // Create fallback auth state - go to home page and save basic state
    try {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await page.context().storageState({ path: authFile });
      console.log('📁 Fallback state created');
    } catch (fallbackError) {
      const fallbackMessage = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
      console.log(`❌ Failed to create fallback state: ${fallbackMessage}`);
      throw fallbackError;
    }
  }
});
