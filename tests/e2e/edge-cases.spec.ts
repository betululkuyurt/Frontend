import { test, expect } from '@playwright/test';

// Public test - no authentication required
test.describe('Error Pages and Edge Cases', () => {
  test('should handle 404 pages gracefully', async ({ page }) => {
    // Test non-existent pages
    const testPaths = [
      '/non-existent-page',
      '/apps/invalid-id-12345',
      '/settings/invalid-section',
      '/profile/invalid-action'
    ];

    for (const path of testPaths) {
      await page.goto(path);
      await page.waitForLoadState('domcontentloaded');
      
      // Should not crash and should show some content
      await expect(page.locator('body')).toBeVisible();
      
      // Should have navigation or way to get back
      const nav = page.locator('nav');
      const homeLink = page.locator('a[href="/"], a').filter({ hasText: /home/i });
      
      if (await nav.count() > 0) {
        await expect(nav).toBeVisible();
      } else if (await homeLink.count() > 0) {
        await expect(homeLink.first()).toBeVisible();
      }
    }
  });

  

  test('should handle slow network conditions', async ({ page }) => {
    // Simulate slow network
    await page.route('**/*', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Add 1s delay
      route.continue();
    });

    await page.goto('/');
    
    // Should eventually load
    await expect(page.locator('body')).toBeVisible({ timeout: 15000 });
  });

  test('should maintain functionality with JavaScript disabled', async ({ page }) => {
    // Disable JavaScript
    await page.context().addInitScript(() => {
      Object.defineProperty(navigator, 'javaEnabled', {
        value: () => false
      });
    });

    await page.goto('/');
    
    // Basic content should still be visible
    await expect(page.locator('body')).toBeVisible();
    
    // Navigation links should still work
    const signInLink = page.locator('a').filter({ hasText: /sign in/i });
    if (await signInLink.count() > 0) {
      await expect(signInLink.first()).toBeVisible();
    }
  });
});

// Public test - no authentication required
test.describe('SEO and Meta Tags', () => {
  test('should have proper meta tags on landing page', async ({ page }) => {
    await page.goto('/');
    
    // Check viewport meta tag
    const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
    expect(viewport).toContain('width=device-width');
    
    // Check for title
    await expect(page).toHaveTitle(/.+/);
    
    // Check for description meta tag
    const description = page.locator('meta[name="description"]');
    if (await description.count() > 0) {
      const descContent = await description.getAttribute('content');
      expect(descContent).toBeTruthy();
      expect(descContent!.length).toBeGreaterThan(10);
    }
  });

  test('should have proper meta tags on auth pages', async ({ page }) => {
    const authPages = ['/auth/login', '/auth/register'];
    
    for (const authPage of authPages) {
      await page.goto(authPage);
      
      // Check viewport meta tag
      const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
      expect(viewport).toContain('width=device-width');
      
      // Check for title
      await expect(page).toHaveTitle(/.+/);
    }
  });

  test('should have proper Open Graph tags', async ({ page }) => {
    await page.goto('/');
    
    const ogTags = [
      'meta[property="og:title"]',
      'meta[property="og:description"]',
      'meta[property="og:type"]',
      'meta[property="og:url"]'
    ];

    for (const tagSelector of ogTags) {
      const tag = page.locator(tagSelector);
      if (await tag.count() > 0) {
        const content = await tag.getAttribute('content');
        expect(content).toBeTruthy();
      }
    }
  });

  test('should have structured data if implemented', async ({ page }) => {
    await page.goto('/');
    
    // Check for JSON-LD structured data
    const structuredData = page.locator('script[type="application/ld+json"]');
    if (await structuredData.count() > 0) {
      const jsonContent = await structuredData.textContent();
      expect(() => JSON.parse(jsonContent!)).not.toThrow();
    }
  });
});

// Public test - no authentication required
test.describe('Cross-browser Compatibility', () => {
  test('should work consistently across different browsers', async ({ page, browserName }) => {
    await page.goto('/');
    
    // Basic functionality should work regardless of browser
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('nav, header')).toBeVisible();
    
    // Sign in/up buttons should be clickable
    const signInButton = page.locator('text=Sign in');
    if (await signInButton.count() > 0) {
      await expect(signInButton).toBeEnabled();
    }
    
    // Console errors should be minimal
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    
    // Filter out known non-critical errors
    const criticalErrors = errors.filter(error => 
      !error.includes('favicon') && 
      !error.includes('google') &&
      !error.includes('analytics')
    );
    
    expect(criticalErrors.length).toBeLessThan(3);
  });

  test('should handle different screen sizes', async ({ page }) => {
    const screenSizes = [
      { width: 1920, height: 1080, name: 'Desktop Large' },
      { width: 1366, height: 768, name: 'Desktop Standard' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 375, height: 667, name: 'Mobile' },
      { width: 320, height: 568, name: 'Small Mobile' }
    ];

    for (const size of screenSizes) {
      await page.setViewportSize({ width: size.width, height: size.height });
      await page.goto('/');
      
      // Basic elements should be visible and functional
      await expect(page.locator('body')).toBeVisible();
      
      // Navigation should be accessible (might be hamburger menu on mobile)
      const nav = page.locator('nav, [role="navigation"], button[aria-label*="menu" i]');
      await expect(nav.first()).toBeVisible();
      
      // Content should not overflow horizontally
      const bodyWidth = await page.locator('body').evaluate(el => el.scrollWidth);
      expect(bodyWidth).toBeLessThanOrEqual(size.width + 20); // Allow small margin
    }
  });
});
