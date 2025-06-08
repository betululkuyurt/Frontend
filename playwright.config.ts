import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests/e2e',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:3000',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    
    /* Take screenshot on failure */
    screenshot: 'only-on-failure',
    
    /* Record video on failure */
    video: 'retain-on-failure',
  },
    projects: [
    // Setup project to authenticate once for protected tests
    { 
      name: 'setup', 
      testMatch: '**/auth.setup.ts' 
    },
      // Public tests (no authentication needed) - landing page, navigation, accessibility, performance
    {
      name: 'public-chromium',
      testMatch: ['**/landing.spec.ts', '**/navigation.spec.ts', '**/accessibility.spec.ts', '**/performance.spec.ts', '**/forms.spec.ts', '**/visual.spec.ts', '**/smoke.spec.ts', '**/test-1.spec.ts'],
      use: { 
        ...devices['Desktop Chrome'],
        // Explicitly no storageState - test public experience
        storageState: undefined,
      },
      dependencies: [], // No dependencies - these are public pages
    },
      {
      name: 'public-firefox',
      testMatch: ['**/landing.spec.ts', '**/navigation.spec.ts', '**/accessibility.spec.ts', '**/performance.spec.ts', '**/forms.spec.ts', '**/visual.spec.ts', '**/smoke.spec.ts', '**/test-1.spec.ts'],
      use: { 
        ...devices['Desktop Firefox'],
        // Explicitly no storageState - test public experience
        storageState: undefined,
      },
      dependencies: [], // No dependencies - these are public pages
    },
      {
      name: 'public-webkit',
      testMatch: ['**/landing.spec.ts', '**/navigation.spec.ts', '**/accessibility.spec.ts', '**/performance.spec.ts', '**/forms.spec.ts', '**/visual.spec.ts', '**/smoke.spec.ts', '**/test-1.spec.ts'],
      use: { 
        ...devices['Desktop Safari'],
        // Explicitly no storageState - test public experience
        storageState: undefined,
      },
      dependencies: [], // No dependencies - these are public pages
    },
    
    // Authentication flow tests (clean slate - no stored auth, no setup dependencies)
    {
      name: 'auth-chromium',
      testMatch: ['**/auth.*.spec.ts', '**/manual-auth.spec.ts'],
      use: { 
        ...devices['Desktop Chrome'],
        // Explicitly no storageState - start fresh for auth flow testing
        storageState: undefined,
      },
      dependencies: [], // Explicitly no dependencies - no setup
    },
    
    {
      name: 'auth-firefox',
      testMatch: ['**/auth.*.spec.ts', '**/manual-auth.spec.ts'],
      use: { 
        ...devices['Desktop Firefox'],
        // Explicitly no storageState - start fresh for auth flow testing
        storageState: undefined,
      },
      dependencies: [], // Explicitly no dependencies - no setup
    },
    
    {
      name: 'auth-webkit',
      testMatch: ['**/auth.*.spec.ts', '**/manual-auth.spec.ts'],
      use: { 
        ...devices['Desktop Safari'],
        // Explicitly no storageState - start fresh for auth flow testing
        storageState: undefined,
      },
      dependencies: [], // Explicitly no dependencies - no setup
    },
      // Protected tests that require authentication (apps dashboard, authenticated features)
    {
      name: 'protected-chromium',
      testMatch: ['**/apps.*.spec.ts', '**/test-2.spec.ts'],
      use: { 
        ...devices['Desktop Chrome'],
        storageState: 'tests/e2e/.auth/user.json',
      },
      dependencies: ['setup'],
    },
      {
      name: 'protected-firefox',
      testMatch: ['**/apps.*.spec.ts', '**/test-2.spec.ts'],
      use: { 
        ...devices['Desktop Firefox'],
        storageState: 'tests/e2e/.auth/user.json',
      },
      dependencies: ['setup'],
    },    {
      name: 'protected-webkit',
      testMatch: ['**/apps.*.spec.ts', '**/test-2.spec.ts'],
      use: { 
        ...devices['Desktop Safari'],
        storageState: 'tests/e2e/.auth/user.json',
      },
      dependencies: ['setup'],
    },    // Mobile browsers - public tests
    {
      name: 'public-mobile-chrome',
      testMatch: ['**/landing.spec.ts', '**/navigation.spec.ts', '**/accessibility.spec.ts', '**/performance.spec.ts', '**/test-1.spec.ts'],
      use: { 
        ...devices['Pixel 5'],
        storageState: undefined,
      },
      dependencies: [],
    },
      {
      name: 'public-mobile-safari',
      testMatch: ['**/landing.spec.ts', '**/navigation.spec.ts', '**/accessibility.spec.ts', '**/performance.spec.ts', '**/test-1.spec.ts'],
      use: { 
        ...devices['iPhone 12'],
        storageState: undefined,
      },
      dependencies: [],
    },
    
    // Mobile browsers - protected tests
    {
      name: 'protected-mobile-chrome',
      testMatch: ['**/apps.*.spec.ts'],
      use: { 
        ...devices['Pixel 5'],
        storageState: 'tests/e2e/.auth/user.json',
      },
      dependencies: ['setup'],
    },
    
    {
      name: 'protected-mobile-safari',
      testMatch: ['**/apps.*.spec.ts'],
      use: { 
        ...devices['iPhone 12'],
        storageState: 'tests/e2e/.auth/user.json',
      },
      dependencies: ['setup'],
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});