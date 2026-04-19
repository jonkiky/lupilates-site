import { test, expect } from '@playwright/test';

test.describe('Admin flow', () => {
  test('admin login page renders', async ({ page }) => {
    await page.goto('/admin/login');
    await expect(page.getByRole('heading', { name: /admin login/i })).toBeVisible();
    await expect(page.getByPlaceholder('Username')).toBeVisible();
    await expect(page.getByPlaceholder('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('unauthenticated admin redirect goes to login', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/admin\/login/);
  });
});
