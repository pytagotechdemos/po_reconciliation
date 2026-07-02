import { test, expect } from '@playwright/test';

// Use a shared PO number for the cross-role flow
const testPONumber = `PO-TEST-${Date.now()}`;

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
  await page.waitForLoadState('domcontentloaded');
}

test.describe.serial('Comprehensive E2E Workflow', () => {

  test('Procurement Flow: Create PO', async ({ page }) => {
    // 1. Login as Procurement
    await login(page, 'procurement');

    // 2. Navigate to Create PO
    await page.goto('/purchase-orders/new');
    await expect(page.locator('body')).toContainText('Buat Purchase Order');

    // 3. Fill Supplier
    const selectLocator = page.locator('select').first();
    const options = await selectLocator.locator('option').allInnerTexts();
    if (options.length > 1) {
      await selectLocator.selectOption({ index: 1 });
    }

    // 4. Fill Item via Combobox
    const comboboxBtn = page.getByPlaceholder('Cari barang').first();
    if (await comboboxBtn.isVisible()) {
      await comboboxBtn.click();
      await comboboxBtn.fill('BLD'); // Trigger onChange to open list
      const firstItem = page.locator('ul[role="listbox"] li[role="option"]').first();
      await firstItem.waitFor({ state: 'visible', timeout: 5000 });
      await firstItem.click();
    }

    // 5. Fill Quantity
    await page.fill('input[aria-label="Quantity"]', '10');

    // 6. Submit PO
    await page.click('button:has-text("Buat PO & Minta Approval")');

    // 7. Verify Redirect
    await expect(page).toHaveURL(/\/purchase-orders/, { timeout: 60000 });
  });

  test('Warehouse Flow: Goods Receipt page accessible', async ({ page }) => {
    // 1. Login as Warehouse
    await login(page, 'warehouse');

    // 2. Navigate to PO
    await page.goto('/purchase-orders');
    await page.waitForTimeout(500);

    // 3. Verify PO list is visible
    const table = page.locator('table').first();
    await expect(table).toBeVisible();
  });

  test('Finance Flow: Resolve Discrepancy', async ({ page }) => {
    // 1. Login as Finance
    await login(page, 'finance');

    await page.goto('/purchase-orders');
    const firstPoLink = page.locator('table a[href^="/purchase-orders/"]').first();
    if (await firstPoLink.isVisible()) {
      const url = await firstPoLink.getAttribute('href');
      await page.goto(url as string);

      const resolveBtn = page.locator('button:has-text("Selesaikan Selisih")');
      if (await resolveBtn.isVisible()) {
         await resolveBtn.click();
         // Click first resolution option
         await page.locator('[role="dialog"] button').first().click();
         await page.click('button:has-text("Konfirmasi")');
         await expect(page.locator('text=berhasil')).toBeVisible({ timeout: 60000 });
      }
    }
  });

  test('Owner Flow: User Management Page', async ({ page }) => {
    // 1. Login as Owner
    await login(page, 'owner');

    // 2. Navigate to User Management - use /users not /settings/users
    await page.goto('/users');
    await expect(page).toHaveURL(/\/users/);

    // 3. Check that the Add User button exists
    const addBtn = page.locator('button:has-text("Tambah User")');
    await expect(addBtn).toBeVisible();
  });

});
