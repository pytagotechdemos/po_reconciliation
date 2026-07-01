import { test, expect } from '@playwright/test';

test.describe('E2E Regression Testing', () => {
  test('Login as Owner and access Dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.click('button:has-text("Owner")');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 30000 });

    // Verify dashboard has some KPI or content
    await expect(page.getByText('Total PO', { exact: false }).or(page.getByText('Purchase Order')).first()).toBeVisible({ timeout: 10000 });
  });

  test('Procurement can create PO', async ({ page }) => {
    await page.goto('/login');
    await page.click('button:has-text("Procurement")');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 30000 });

    await page.goto('/purchase-orders');
    await expect(page.locator('body')).toContainText('Daftar Purchase Order', { timeout: 15000 });

    // Create button in main content area
    const createBtn = page.locator('main').locator('a[href="/purchase-orders/new"]');
    await expect(createBtn).toBeVisible();
  });

  test('Warehouse cannot create PO', async ({ page }) => {
    await page.goto('/login');
    await page.click('button:has-text("Warehouse")');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 30000 });

    await page.goto('/purchase-orders');
    await expect(page.locator('body')).toContainText('Daftar Purchase Order', { timeout: 15000 });

    // No create button in main content for warehouse
    const createBtn = page.locator('main').locator('a[href="/purchase-orders/new"]');
    await expect(createBtn).not.toBeVisible();
  });

  test('Finance can access invoices and reports', async ({ page }) => {
    await page.goto('/login');
    await page.click('button:has-text("Finance")');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 30000 });

    await page.goto('/invoices');
    await expect(page.locator('body')).toContainText('Manajemen Invoice', { timeout: 15000 });

    await page.goto('/reports');
    await expect(page.locator('body')).toContainText('Laporan', { timeout: 15000 });
  });

  test('PO form loads correctly', async ({ page }) => {
    await page.goto('/login');
    await page.click('button:has-text("Procurement")');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 30000 });

    await page.goto('/purchase-orders/new');
    await expect(page.locator('body')).toContainText('Buat Purchase Order', { timeout: 15000 });
    await expect(page.locator('select').first()).toBeVisible({ timeout: 5000 });
  });
});
