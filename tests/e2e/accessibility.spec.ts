import { test, expect } from '@playwright/test';

test.describe('Accessibility Tests', () => {
  

  test('should have alt text for images', async ({ page }) => {
    await page.goto('/');
    
    const images = page.locator('img');
    const imageCount = await images.count();
    
    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      const ariaLabel = await img.getAttribute('aria-label');
      const role = await img.getAttribute('role');
      
      // Images should have alt text, aria-label, or be decorative (role="presentation")
      expect(alt !== null || ariaLabel !== null || role === 'presentation').toBeTruthy();
    }
  });

  test('should have proper form labels', async ({ page }) => {
    await page.goto('/auth/login');
    
    const inputs = page.locator('input[type="email"], input[type="password"], input[type="text"]');
    const inputCount = await inputs.count();
    
    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i);
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledBy = await input.getAttribute('aria-labelledby');
      
      if (id) {
        // Check if there's a label for this input
        const label = page.locator(`label[for="${id}"]`);
        const hasLabel = await label.count() > 0;
        
        // Input should have either a label, aria-label, or aria-labelledby
        expect(hasLabel || ariaLabel !== null || ariaLabelledBy !== null).toBeTruthy();
      }
    }
  });

  test('should have proper button accessibility', async ({ page }) => {
    await page.goto('/');
    
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i);
      const text = await button.textContent();
      const ariaLabel = await button.getAttribute('aria-label');
      const title = await button.getAttribute('title');
      
      // Buttons should have text content, aria-label, or title
      const hasAccessibleName = (text && text.trim().length > 0) || ariaLabel || title;
      expect(hasAccessibleName).toBeTruthy();
    }
  });



  

  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/');
    
    // Test tab navigation
    const interactiveElements = page.locator('a, button, input, select, textarea, [tabindex]');
    const elementCount = await interactiveElements.count();
    
    if (elementCount > 0) {
      // Focus first element
      await page.keyboard.press('Tab');
      
      // Check if an element is focused
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
      
      // Test Enter key on buttons/links
      const tagName = await focusedElement.evaluate(el => el.tagName.toLowerCase());
      if (tagName === 'button' || tagName === 'a') {
        // Just check that Enter key doesn't cause errors
        await page.keyboard.press('Enter');
        await page.waitForTimeout(1000);
      }
    }
  });
});
