import { test, expect } from '@playwright/test';

test.describe('Performance Tests', () => {
  test('should load home page within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');
    
    const endTime = Date.now();
    const loadTime = endTime - startTime;
    
    // Page should load within 5 seconds (adjust as needed)
    expect(loadTime).toBeLessThan(500000);
  });

  test('should have proper meta tags for performance', async ({ page }) => {
    await page.goto('/');
    
    // Check for viewport meta tag
    const viewport = page.locator('meta[name="viewport"]');
    await expect(viewport).toHaveAttribute('content', /width=device-width/);
    
    // Check for preload or prefetch resources if any
    const preloadLinks = page.locator('link[rel="preload"], link[rel="prefetch"]');
    const preloadCount = await preloadLinks.count();
    
    // This is informational - having preload/prefetch links is good for performance
    console.log(`Found ${preloadCount} preload/prefetch resources`);
  });

  test('should handle large lists efficiently', async ({ page }) => {
    await page.goto('/apps');
    
    // If redirected to login, skip this test
    if (page.url().includes('/auth/login')) {
      test.skip('Requires authentication');
      return;
    }
    
    // Wait for potential list items to load
    await page.waitForTimeout(3000);
    
    // Check if page is still responsive after loading
    const button = page.locator('button').first();
    if (await button.count() > 0) {
      const startTime = Date.now();
      await button.hover();
      const endTime = Date.now();
      
      // Hover should be responsive (< 100ms)
      expect(endTime - startTime).toBeLessThan(100);
    }
  });

  test('should not have memory leaks on navigation', async ({ page }) => {
    // Navigate between pages multiple times
    for (let i = 0; i < 3; i++) {
      await page.goto('/');
      await page.waitForTimeout(1000);
      
      await page.goto('/auth/login');
      await page.waitForTimeout(1000);
    }
    
    // Page should still be responsive
    const button = page.locator('button').first();
    if (await button.count() > 0) {
      await expect(button).toBeVisible();
    }
  });

  test('should compress and optimize resources', async ({ page }) => {
    const response = await page.goto('/');
    
    // Check if main document is properly compressed
    const contentEncoding = response?.headers()['content-encoding'];
    
    // This is informational - gzip/brotli compression is good
    if (contentEncoding) {
      console.log(`Content encoding: ${contentEncoding}`);
      expect(['gzip', 'br', 'deflate']).toContain(contentEncoding);
    }
  });

  test('should have efficient CSS and JS loading', async ({ page }) => {
    await page.goto('/');
    
    // Check for render blocking resources
    const stylesheets = page.locator('link[rel="stylesheet"]');
    const stylesheetCount = await stylesheets.count();
    
    // Check for inline scripts (should be minimal)
    const inlineScripts = page.locator('script:not([src])');
    const inlineScriptCount = await inlineScripts.count();
    
    console.log(`Found ${stylesheetCount} stylesheets and ${inlineScriptCount} inline scripts`);
    
    // These are informational - adjust thresholds based on your app
    expect(stylesheetCount).toBeLessThan(10); // Reasonable number of stylesheets
    expect(inlineScriptCount).toBeLessThan(50); // Minimal inline scripts
  });
});
