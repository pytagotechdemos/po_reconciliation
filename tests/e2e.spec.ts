import { test, expect } from '@playwright/test';

test.describe('E2E Regression Testing', () => {
  test('Login and Dashboard as Admin', async ({ page }) => {
    await page.goto('/login');
    // Click the Owner role button
    await page.click('button:has-text("Owner")');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for Dashboard (Next.js dev compilation can be slow)
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 30000 });
    await expect(page.locator('body')).toContainText('Dashboard', { timeout: 30000 });
    
    // Check Top KPIs
    await expect(page.locator('body')).toContainText('Total Spending', { timeout: 10000 });
    await expect(page.locator('body')).toContainText('Total PO', { timeout: 10000 });
  });

  test('Procurement Page Load test', async ({ page }) => {
    await page.goto('/login');
    await page.click('button:has-text("Procurement")');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Go to Purchase Orders
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 30000 });
    await page.goto('/purchase-orders');
    await expect(page.locator('body')).toContainText('Daftar Purchase Order', { timeout: 30000 });
    
    // Verify Create button is visible by checking href
    await expect(page.locator('a[href="/purchase-orders/new"]')).toBeVisible();
  });

  test('Warehouse Page Load test', async ({ page }) => {
    await page.goto('/login');
    await page.click('button:has-text("Warehouse")');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Go to POs
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 30000 });
    await page.goto('/purchase-orders');
    await expect(page.locator('body')).toContainText('Daftar Purchase Order', { timeout: 30000 });
    
    // Verify no Create button
    await expect(page.locator('a[href="/purchase-orders/new"]')).not.toBeVisible();
  });

  test('Invoice and Reports generation Test', async ({ page }) => {
    await page.goto('/login');
    await page.click('button:has-text("Finance")');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Test invoices
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 30000 });
    await page.goto('/invoices');
    await expect(page.locator('body')).toContainText('Manajemen Invoice', { timeout: 30000 });

    // Test reports
    await page.goto('/reports');
    await expect(page.locator('body')).toContainText('Laporan', { timeout: 30000 });
  });
});
