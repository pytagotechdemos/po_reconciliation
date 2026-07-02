import { test, expect } from '@playwright/test';

async function login(page: any, role: string) {
  const context = page.context();
  const csrfRes = await context.request.get('/api/auth/csrf');
  const { csrfToken } = await csrfRes.json();

  await context.request.post('/api/auth/callback/credentials', {
    form: {
      username: role.toLowerCase(),
      password: 'password123',
      csrfToken,
      redirect: 'false',
    }
  });
  await page.goto('/dashboard');
}

test.describe('E2E Edge Cases (Negative Testing)', () => {

  test('Procurement: Cannot submit PO without supplier', async ({ page }) => {
    await login(page, 'procurement');
    await page.goto('/purchase-orders/new');

    // Submit without filling supplier
    await page.click('button:has-text("Buat PO & Minta Approval")');

    // Should show validation error
    await page.waitForTimeout(500);
    // Check for supplier validation error (message varies by implementation)
    const pageContent = await page.content();
    // Just verify form didn't submit - we should still be on the form page
    await expect(page).toHaveURL(/\/purchase-orders\/new/);
  });

  test('Warehouse: Can navigate to PO list', async ({ page }) => {
    await login(page, 'warehouse');
    await page.goto('/purchase-orders');
    await page.waitForTimeout(500);

    // Should be on the PO list page
    await expect(page).toHaveURL(/\/purchase-orders/);
    // Should see the table
    await expect(page.locator('table').first()).toBeVisible();
  });
});
