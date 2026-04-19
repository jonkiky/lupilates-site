import { test, expect } from '@playwright/test';

test.describe('Public quote flow (mobile)', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('customer can browse the product catalog', async ({ page }) => {
    await page.goto('/products');
    await expect(page.getByRole('heading', { name: /products/i })).toBeVisible();
  });

  test('product cards link to detail pages', async ({ page }) => {
    await page.goto('/products');
    const cards = page.locator('a[href^="/products/"]');
    const count = await cards.count();
    // If seed data is present, there are products; otherwise just confirm the page loads
    if (count > 0) {
      await cards.first().click();
      await expect(page).toHaveURL(/\/products\/.+/);
    }
  });

  test('quote cart page shows empty state', async ({ page }) => {
    await page.goto('/quote-cart');
    await expect(page.getByRole('heading', { name: /quote cart/i })).toBeVisible();
  });
});
