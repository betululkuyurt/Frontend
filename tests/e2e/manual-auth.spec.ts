import { test } from '@playwright/test';

test('manual auth test', async ({ page }) => {
  const testEmail = process.env.TEST_USER_EMAIL || 'test@example.com';
  const testPassword = process.env.TEST_USER_PASSWORD || 'password123';
  
  console.log(`Testing with email: ${testEmail}`);
  
  await page.goto('/auth/login');
  await page.fill('input[type="email"], input[name="email"]', testEmail);
  await page.fill('input[type="password"], input[name="password"]', testPassword);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(5000);
  
  console.log(`Final URL: ${page.url()}`);
  
  // Save state if successful
  if (page.url().includes('/apps')) {
    await page.context().storageState({ path: 'tests/e2e/.auth/user.json' });
    console.log('✅ Auth state saved!');
  } else {
    console.log('❌ Login failed');
  }
});
