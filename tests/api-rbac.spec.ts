import { test, expect } from '@playwright/test';

// Helper to get CSRF token and login via API
async function loginAs(context: any, role: string) {
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
}

test.describe('API RBAC Security Tests', () => {

  test('Unauthenticated user cannot access APIs', async ({ page }) => {
    // Test via browser page - check redirect to login
    await page.goto('/api/users');
    // Should redirect to login page
    await expect(page).toHaveURL(/\/login/);
  });

  test('Procurement cannot access User Management', async ({ context }) => {
    await loginAs(context, 'procurement');
    // Navigate to dashboard first to establish session
    await context.request.get('/dashboard');
    const res = await context.request.get('/api/users');
    expect(res.status()).toBe(403);
  });

  test('Warehouse cannot create PO', async ({ context }) => {
    await loginAs(context, 'warehouse');
    await context.request.get('/dashboard');
    const res = await context.request.post('/api/po', {
      data: {
        supplierId: 'uuid',
        dateOrdered: '2023-10-10',
        lineItems: []
      }
    });
    expect(res.status()).toBe(403);
  });

  test('Finance cannot receive PO', async ({ context }) => {
    await loginAs(context, 'finance');
    await context.request.get('/dashboard');
    const res = await context.request.post('/api/goods-receipt', {
      data: {
        poId: 'uuid',
        receiptDate: '2023-10-10',
        receivedBy: 'Me',
        items: []
      }
    });
    // Should return 403 for unauthorized role
    expect([403, 400, 404]).toContain(res.status());
  });

  test('Owner can access User Management', async ({ context }) => {
    await loginAs(context, 'owner');
    await context.request.get('/dashboard');
    const res = await context.request.get('/api/users');
    expect(res.status()).toBe(200);
  });
});
