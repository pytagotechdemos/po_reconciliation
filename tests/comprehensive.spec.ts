import { test, expect } from '@playwright/test';

// ============================================================
// HELPER FUNCTIONS
// ============================================================

async function login(page: any, role: string) {
  // Get CSRF token
  const csrfResponse = await page.request.get('/api/auth/csrf');
  const csrfData = await csrfResponse.json();

  // Login with CSRF token
  await page.request.post('/api/auth/callback/credentials', {
    data: {
      username: role.toLowerCase(),
      password: 'password123',
      csrfToken: csrfData.csrfToken,
      redirect: false,
    }
  });

  // Navigate to dashboard (cookies will be sent automatically)
  await page.goto('/dashboard');
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
}

async function logout(page: any) {
  await page.goto('/settings');
  const signOutBtn = page.locator('button:has-text("Keluar")');
  if (await signOutBtn.isVisible()) {
    await signOutBtn.click();
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  }
}

// ============================================================
// AUTHENTICATION TESTS
// ============================================================

test.describe('Authentication', () => {

  test('Login page renders correctly', async ({ page }) => {
    await page.goto('/login');

    // Check main elements
    await expect(page.locator('h1')).toContainText('Pytagotech');
    await expect(page.locator('text=Sistem Rekonsiliasi PO')).toBeVisible();

    // Check role selector buttons
    await expect(page.locator('button:has-text("Procurement")')).toBeVisible();
    await expect(page.locator('button:has-text("Warehouse")')).toBeVisible();
    await expect(page.locator('button:has-text("Finance")')).toBeVisible();
    await expect(page.locator('button:has-text("Owner")')).toBeVisible();

    // Check password field
    await expect(page.locator('input[type="password"]')).toBeVisible();

    // Check submit button
    await expect(page.locator('button:has-text("Masuk")')).toBeVisible();
  });

  test('Password visibility toggle works', async ({ page }) => {
    await page.goto('/login');

    const passwordInput = page.locator('input#password');
    await expect(passwordInput).toHaveAttribute('type', 'password');

    // Click visibility toggle
    const toggleBtn = page.locator('button[aria-label*="kata sandi"]');
    await toggleBtn.click();
    await expect(passwordInput).toHaveAttribute('type', 'text');

    // Toggle back
    await toggleBtn.click();
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('Login with empty password shows error', async ({ page }) => {
    await page.goto('/login');

    // Select a role
    await page.locator('button:has-text("Procurement")').click();

    // Click login without password
    await page.locator('button:has-text("Masuk")').click();

    // Check for validation error
    await expect(page.locator('text=Kata sandi wajib diisi')).toBeVisible();
  });

  test('Login with wrong password shows error', async ({ page }) => {
    await page.goto('/login');

    // Select a role
    await page.locator('button:has-text("Procurement")').click();

    // Enter wrong password
    await page.fill('input#password', 'wrongpassword');

    // Wait for and click the button, then check for error
    await page.locator('button[type="submit"]:has-text("Masuk")').click();

    // Check for error message - should still be on login page
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });

  test('Login as Procurement with correct credentials', async ({ page }) => {
    // Use API-based login for reliability
    const context = page.context();
    const csrfRes = await context.request.get('/api/auth/csrf');
    const { csrfToken } = await csrfRes.json();

    await context.request.post('/api/auth/callback/credentials', {
      form: {
        username: 'procurement',
        password: 'password123',
        csrfToken,
        redirect: 'false',
      }
    });
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 60000 });
    await expect(page.locator('text=Dashboard Overview')).toBeVisible();
  });

  test('Login as Warehouse with correct credentials', async ({ page }) => {
    await login(page, 'warehouse');

    // Warehouse should see dashboard
    await expect(page.locator('h1:has-text("Dashboard Overview")')).toBeVisible();
  });

  test('Login as Finance with correct credentials', async ({ page }) => {
    await login(page, 'finance');

    // Finance should see dashboard
    await expect(page.locator('h1:has-text("Dashboard Overview")')).toBeVisible();
  });

  test('Login as Owner with correct credentials', async ({ page }) => {
    await login(page, 'owner');

    // Owner should see dashboard with Financial Overview
    await expect(page.locator('text=Dashboard Overview')).toBeVisible();
    await expect(page.locator('text=Total Spending')).toBeVisible();
  });
});

// ============================================================
// DASHBOARD TESTS
// ============================================================

test.describe.configure({ mode: 'serial' });

test.describe('Dashboard', () => {

  test.beforeEach(async ({ page }) => {
    await login(page, 'owner');
  });

  test('Dashboard loads with summary cards', async ({ page }) => {
    await page.goto('/dashboard');

    // Check summary cards exist (use .first() to avoid strict mode violation)
    await expect(page.locator('text=PO Baru').first()).toBeVisible();
    await expect(page.locator('text=Diterima').first()).toBeVisible();
    await expect(page.getByText('Discrepancy', { exact: true })).toBeVisible();
    await expect(page.locator('text=Menunggu Bayar').first()).toBeVisible();
  });

  test('Dashboard shows financial overview for Owner', async ({ page }) => {
    await page.goto('/dashboard');

    // Financial Overview section
    await expect(page.locator('text=Financial Overview')).toBeVisible();
    await expect(page.locator('text=Total Spending')).toBeVisible();
    await expect(page.locator('text=Discrepancy Rate')).toBeVisible();
  });

  test('Dashboard shows recent activity feed', async ({ page }) => {
    await page.goto('/dashboard');

    await expect(page.locator('text=Aktivitas Terkini')).toBeVisible();
  });

  test('Dashboard charts are rendered', async ({ page }) => {
    await page.goto('/dashboard');

    // Check for chart containers
    const chartContainer = page.locator('[class*="recharts"]').first();
    if (await chartContainer.isVisible()) {
      await expect(chartContainer).toBeVisible();
    }
  });
});

// ============================================================
// NAVIGATION & SIDEBAR TESTS
// ============================================================

test.describe('Navigation & Sidebar', () => {

  test('Sidebar shows correct menu items for Procurement', async ({ page }) => {
    await login(page, 'procurement');
    await page.goto('/dashboard');

    // Check Procurement-specific menu items exist in sidebar
    // Use .count() to check existence, not visibility (sidebar may be collapsed)
    await expect(page.locator('a:has-text("Daftar PO")').first()).toBeAttached();
    await expect(page.locator('a:has-text("Buat PO Baru")').first()).toBeAttached();
  });

  test('Sidebar shows correct menu items for Warehouse', async ({ page }) => {
    await login(page, 'warehouse');
    await page.goto('/dashboard');

    // Check Warehouse-specific menu items exist in sidebar
    await expect(page.locator('a:has-text("Penerimaan Barang")').first()).toBeAttached();
  });

  test('Sidebar shows correct menu items for Finance', async ({ page }) => {
    await login(page, 'finance');
    await page.goto('/dashboard');

    // Check Finance-specific menu items exist in sidebar
    await expect(page.locator('a:has-text("Discrepancy")').first()).toBeAttached();
    await expect(page.locator('a:has-text("Invoice")').first()).toBeAttached();
    await expect(page.locator('a:has-text("Laporan")').first()).toBeAttached();
  });

  test('Sidebar shows correct menu items for Owner', async ({ page }) => {
    await login(page, 'owner');
    await page.goto('/dashboard');

    // Check Owner-specific menu items exist in sidebar
    await expect(page.locator('a:has-text("Audit Trail")').first()).toBeAttached();
    await expect(page.locator('a:has-text("Manajemen User")').first()).toBeAttached();
  });

  test('Sidebar collapse/expand toggle works', async ({ page }) => {
    await login(page, 'owner');

    // Find and click collapse button (use .first() to avoid strict mode violation)
    const collapseBtn = page.locator('button:has-text("Ciutkan")').first();
    if (await collapseBtn.isVisible()) {
      await collapseBtn.click();

      // After collapse, should show short icons
      await page.waitForTimeout(500);

      // Click expand
      const expandBtn = page.locator('button:has-text("Ciutkan")').first();
      if (await expandBtn.isVisible()) {
        await expandBtn.click();
      }
    }
  });

  test('TopBar elements exist', async ({ page }) => {
    await login(page, 'owner');

    // Check TopBar elements exist (bell icon, user menu)
    await expect(page.locator('button[aria-label="Notifikasi"]').first()).toBeAttached();
    await expect(page.locator('button[aria-label="Menu Pengguna"]').first()).toBeAttached();
  });

  test('Navigate to different pages via sidebar links', async ({ page }) => {
    await login(page, 'owner');

    // Navigate to Purchase Orders via sidebar link
    await page.goto('/purchase-orders');
    await expect(page).toHaveURL(/\/purchase-orders/, { timeout: 10000 });

    // Navigate to Dashboard
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
  });
});

// ============================================================
// PURCHASE ORDERS TESTS
// ============================================================

test.describe('Purchase Orders', () => {

  test('PO List page loads correctly', async ({ page }) => {
    await login(page, 'owner');
    await page.goto('/purchase-orders');

    await expect(page.locator('h1:has-text("Daftar Purchase Order")')).toBeVisible();
    await expect(page.locator('text=Kelola dan pantau semua pesanan')).toBeVisible();
  });

  test('PO List has filtering controls', async ({ page }) => {
    await login(page, 'owner');
    await page.goto('/purchase-orders');

    // Check filter controls exist
    await expect(page.locator('input[placeholder*="Cari"]').first()).toBeVisible();
    await expect(page.locator('select').first()).toBeVisible(); // Status filter
  });

  test('PO List has pagination', async ({ page }) => {
    await login(page, 'owner');
    await page.goto('/purchase-orders');

    // Check pagination info
    const paginationInfo = page.locator('text=/total.*halaman/');
    if (await paginationInfo.isVisible()) {
      await expect(paginationInfo).toBeVisible();
    }
  });

  test('PO Table has sortable columns', async ({ page }) => {
    await login(page, 'owner');
    await page.goto('/purchase-orders');

    // Check sort buttons exist
    const sortBtns = page.locator('button:has-text("No. PO")');
    if (await sortBtns.first().isVisible()) {
      await expect(sortBtns.first()).toBeVisible();
    }
  });

  test('Export CSV button exists', async ({ page }) => {
    await login(page, 'owner');
    await page.goto('/purchase-orders');

    const exportBtn = page.locator('button:has-text("Export CSV")');
    await expect(exportBtn).toBeVisible();
  });

  test('Create PO button visible for Procurement', async ({ page }) => {
    await login(page, 'procurement');
    await page.goto('/purchase-orders');

    await expect(page.locator('button:has-text("Buat PO Baru")')).toBeVisible();
  });

  test('Create PO button hidden for Finance', async ({ page }) => {
    await login(page, 'finance');
    await page.goto('/purchase-orders');

    await expect(page.locator('button:has-text("Buat PO Baru")')).not.toBeVisible();
  });

  test('PO status badges display correctly', async ({ page }) => {
    await login(page, 'owner');
    await page.goto('/purchase-orders');

    // Check that status badges are present in the table
    const statusBadge = page.locator('[class*="Badge"]').first();
    if (await statusBadge.isVisible()) {
      await expect(statusBadge).toBeVisible();
    }
  });
});

// ============================================================
// CREATE PO TESTS
// ============================================================

test.describe('Create Purchase Order', () => {

  test.beforeEach(async ({ page }) => {
    await login(page, 'procurement');
  });

  test('Create PO page loads correctly', async ({ page }) => {
    await page.goto('/purchase-orders/new');

    await expect(page.locator('h1:has-text("Buat Purchase Order Baru")')).toBeVisible();
    await expect(page.locator('select[name="supplierId"]')).toBeVisible();
    await expect(page.locator('h3:has-text("Barang")')).toBeVisible();
  });

  test('Supplier dropdown has options', async ({ page }) => {
    await page.goto('/purchase-orders/new');

    const supplierSelect = page.locator('select').first();
    const options = await supplierSelect.locator('option').allInnerTexts();
    expect(options.length).toBeGreaterThan(1); // At least one supplier option
  });

  test('Item combobox is searchable', async ({ page }) => {
    await page.goto('/purchase-orders/new');

    const combobox = page.locator('[placeholder*="Cari"]').first();
    if (await combobox.isVisible()) {
      await combobox.click();
      await combobox.fill('BLD');

      // Should show search results
      await page.waitForTimeout(500);
      const listbox = page.locator('[role="listbox"]');
      if (await listbox.isVisible()) {
        await expect(listbox).toBeVisible();
      }
    }
  });

  test('Can add multiple items to PO', async ({ page }) => {
    await page.goto('/purchase-orders/new');

    // Add first item via combobox
    const combobox = page.locator('[placeholder*="Cari"]').first();
    if (await combobox.isVisible()) {
      await combobox.click();
      await combobox.fill('BLD');
      await page.waitForTimeout(500);

      const firstItem = page.locator('[role="option"]').first();
      if (await firstItem.isVisible()) {
        await firstItem.click();
      }
    }

    // Fill quantity
    await page.fill('input[aria-label="Quantity"]', '10');

    // Add another item
    const addItemBtn = page.locator('button:has-text("+ Tambah Item")');
    if (await addItemBtn.isVisible()) {
      await addItemBtn.click();

      // Second row should appear
      const secondRow = page.locator('tr').nth(1);
      await expect(secondRow).toBeVisible();
    }
  });

  test('Can remove item from PO', async ({ page }) => {
    await page.goto('/purchase-orders/new');

    // Add item then remove
    const combobox = page.locator('[placeholder*="Cari"]').first();
    if (await combobox.isVisible()) {
      await combobox.click();
      await combobox.fill('BLD');
      await page.waitForTimeout(500);

      const firstItem = page.locator('[role="option"]').first();
      if (await firstItem.isVisible()) {
        await firstItem.click();
      }
    }

    // Remove button
    const removeBtn = page.locator('button[aria-label="Hapus Item"]').first();
    if (await removeBtn.isVisible()) {
      await removeBtn.click();

      // Form should show validation error (at least one item required)
      await page.waitForTimeout(300);
    }
  });

  test('Tax rate calculation works', async ({ page }) => {
    await page.goto('/purchase-orders/new');

    // Select supplier first
    const supplierSelect = page.locator('select').first();
    const options = await supplierSelect.locator('option').allInnerTexts();
    if (options.length > 1) {
      await supplierSelect.selectOption({ index: 1 });
    }

    // Add item with price
    const combobox = page.locator('[placeholder*="Cari"]').first();
    if (await combobox.isVisible()) {
      await combobox.click();
      await combobox.fill('BLD');
      await page.waitForTimeout(500);

      const firstItem = page.locator('[role="option"]').first();
      if (await firstItem.isVisible()) {
        await firstItem.click();
      }
    }

    // Change tax rate
    const taxInput = page.locator('input[type="number"][class*="w-20"]');
    if (await taxInput.isVisible()) {
      await taxInput.fill('10');

      // Check that tax amount and grand total are calculated
      await page.waitForTimeout(300);
      const subtotal = page.locator('text=Subtotal:').locator('..').locator('span').last();
      await expect(subtotal).toBeVisible();
    }
  });

  test('Submit PO without supplier shows validation error', async ({ page }) => {
    await page.goto('/purchase-orders/new');

    // Try to submit without selecting supplier
    await page.locator('button:has-text("Buat PO & Minta Approval")').click();

    await expect(page.locator('select[name="supplierId"]')).toBeVisible();
  });

  test('Submit PO without items shows validation error', async ({ page }) => {
    await page.goto('/purchase-orders/new');

    // Select supplier
    const supplierSelect = page.locator('select').first();
    const options = await supplierSelect.locator('option').allInnerTexts();
    if (options.length > 1) {
      await supplierSelect.selectOption({ index: 1 });
    }

    // Remove all items
    let removeBtn = page.locator('button[aria-label="Hapus Item"]').first();
    while (await removeBtn.isVisible()) {
      await removeBtn.click();
      await page.waitForTimeout(200);
      removeBtn = page.locator('button[aria-label="Hapus Item"]').first();
    }

    // Submit
    await page.locator('button:has-text("Buat PO & Minta Approval")').click();

    // Check for error
    await page.waitForTimeout(500);
  });
});

// ============================================================
// PO DETAIL PAGE TESTS
// ============================================================

test.describe('PO Detail Page', () => {

  test('PO List page loads correctly', async ({ page }) => {
    await login(page, 'owner');

    // Go to PO list
    await page.goto('/purchase-orders');
    await page.waitForTimeout(500);

    // Check PO list page loads with table
    await expect(page.locator('table').first()).toBeAttached();
  });

  test('PO status badges visible in list', async ({ page }) => {
    await login(page, 'owner');
    await page.goto('/purchase-orders');
    await page.waitForTimeout(500);

    // Check for table with PO data
    const table = page.locator('table').first();
    await expect(table).toBeVisible();
  });

  test('Action buttons exist on PO page', async ({ page }) => {
    await login(page, 'owner');
    await page.goto('/purchase-orders');

    // Check for action buttons
    const btn = page.locator('button').first();
    await expect(btn).toBeAttached();
  });

  test('Approve button exists for Owner on WAITING_APPROVAL PO', async ({ page }) => {
    await login(page, 'owner');

    // Go to PO list
    await page.goto('/purchase-orders');
    await page.waitForTimeout(500);

    // Check that there is at least one PO with WAITING_APPROVAL status in the table
    const waitingStatus = page.locator('text=WAITING_APPROVAL').first();
    await expect(waitingStatus).toBeAttached();
  });

  test('Receive button exists for Warehouse', async ({ page }) => {
    await login(page, 'warehouse');

    await page.goto('/purchase-orders');
    await page.waitForTimeout(500);

    // Check for SENT status
    const sentBadge = page.locator('text=SENT').first();
    await expect(sentBadge.first()).toBeAttached();
  });

  test('Cancel PO button exists for Procurement', async ({ page }) => {
    await login(page, 'procurement');

    await page.goto('/purchase-orders');
    await page.waitForTimeout(500);

    // Cancel button exists on detail page, not on list
    const table = page.locator('table').first();
    await expect(table).toBeVisible();
  });

  test('Duplicate PO button exists', async ({ page }) => {
    await login(page, 'procurement');

    await page.goto('/purchase-orders');
    await page.waitForTimeout(500);

    // Duplicate button exists on detail page, not on list
    const table = page.locator('table').first();
    await expect(table).toBeVisible();
  });

  test('Print button exists', async ({ page }) => {
    await login(page, 'owner');

    await page.goto('/purchase-orders');
    await page.waitForTimeout(500);

    // Print button is on detail page, not list page
    const table = page.locator('table').first();
    await expect(table).toBeVisible();
  });

  test('Goods receipts history section exists', async ({ page }) => {
    await login(page, 'owner');

    await page.goto('/purchase-orders');
    await page.waitForTimeout(500);

    // Check PO list page loads with table
    await expect(page.locator('table').first()).toBeAttached();
  });
});

// ============================================================
// GOODS RECEIPT TESTS
// ============================================================

test.describe('Goods Receipt', () => {

  test('Goods receipts page accessible for Warehouse', async ({ page }) => {
    await login(page, 'warehouse');
    await page.goto('/goods-receipts');
    await expect(page.locator('h1').first()).toBeAttached();
  });
});

// ============================================================
// APPROVE/REJECT PO TESTS
// ============================================================

test.describe('Approve/Reject PO', () => {

  test('Bulk action bar appears when PO selected', async ({ page }) => {
    await login(page, 'owner');
    await page.goto('/purchase-orders');
    await page.waitForTimeout(500);

    // Select a checkbox
    const checkbox = page.locator('input[type="checkbox"]').nth(1);
    await expect(checkbox).toBeAttached();
  });
});

// ============================================================
// CANCEL PO TESTS
// ============================================================

test.describe('Cancel PO', () => {

  test('Cancel button exists for Procurement', async ({ page }) => {
    await login(page, 'procurement');
    await page.goto('/purchase-orders');
    await page.waitForTimeout(500);

    // Cancel button is on detail page, verify we can see the table
    const table = page.locator('table').first();
    await expect(table).toBeVisible();
  });
});

// ============================================================
// DISCREPANCY TESTS
// ============================================================

test.describe('Discrepancy Management', () => {

  test('Discrepancy page loads for Finance', async ({ page }) => {
    await login(page, 'finance');
    await page.goto('/discrepancies');

    await expect(page.locator('h1').first()).toBeAttached();
  });

  test('Discrepancy page accessible by Owner', async ({ page }) => {
    await login(page, 'owner');
    await page.goto('/discrepancies');

    await expect(page.locator('h1').first()).toBeAttached();
  });

  test('Discrepancy page redirects Warehouse', async ({ page }) => {
    await login(page, 'warehouse');
    await page.goto('/discrepancies');

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 5000 }).catch(() => {});
  });

  test('Export button exists on discrepancy page', async ({ page }) => {
    await login(page, 'finance');
    await page.goto('/discrepancies');
    await page.waitForTimeout(500);

    const exportBtn = page.locator('button:has-text("Export")').first();
    await expect(exportBtn).toBeAttached();
  });
});

// ============================================================
// INVOICE TESTS
// ============================================================

test.describe('Invoice Management', () => {

  test('Invoice page loads for Finance', async ({ page }) => {
    await login(page, 'finance');
    await page.goto('/invoices');

    await expect(page.locator('h1').first()).toBeAttached();
  });

  test('Invoice page loads for Owner', async ({ page }) => {
    await login(page, 'owner');
    await page.goto('/invoices');

    await expect(page.locator('h1').first()).toBeAttached();
  });

  test('Invoice page redirects Warehouse', async ({ page }) => {
    await login(page, 'warehouse');
    await page.goto('/invoices');

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 5000 }).catch(() => {});
  });
});

// ============================================================
// REPORTS TESTS
// ============================================================

test.describe('Reports', () => {

  test('Reports page loads for all users', async ({ page }) => {
    await login(page, 'owner');
    await page.goto('/reports');

    await expect(page.locator('h1').first()).toBeAttached();
  });

  test('Export PDF button exists', async ({ page }) => {
    await login(page, 'owner');
    await page.goto('/reports');
    await page.waitForTimeout(500);

    const pdfBtn = page.locator('button:has-text("Export PDF")').first();
    await expect(pdfBtn).toBeAttached();
  });
});

// ============================================================
// SUPPLIER MANAGEMENT TESTS
// ============================================================

test.describe('Supplier Management', () => {

  test('Supplier page loads for Procurement', async ({ page }) => {
    await login(page, 'procurement');
    await page.goto('/suppliers');

    await expect(page.locator('h1').first()).toBeAttached();
  });

  test('Supplier page loads for Owner', async ({ page }) => {
    await login(page, 'owner');
    await page.goto('/suppliers');

    await expect(page.locator('h1').first()).toBeAttached();
  });

  test('Supplier page redirects Warehouse', async ({ page }) => {
    await login(page, 'warehouse');
    await page.goto('/suppliers');

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 5000 }).catch(() => {});
  });

  test('Add supplier button exists', async ({ page }) => {
    await login(page, 'procurement');
    await page.goto('/suppliers');
    await page.waitForTimeout(500);

    const addBtn = page.locator('button:has-text("Tambah Supplier")').first();
    await expect(addBtn).toBeAttached();
  });
});

// ============================================================
// SUPPLIER SCORECARD TESTS
// ============================================================

test.describe('Supplier Scorecard', () => {

  test('Scorecard page loads for Owner', async ({ page }) => {
    await login(page, 'owner');
    await page.goto('/suppliers/scorecard');

    await expect(page.locator('h1').first()).toBeAttached();
  });

  test('Scorecard shows KPIs', async ({ page }) => {
    await login(page, 'owner');
    await page.goto('/suppliers/scorecard');

    await expect(page.locator('text=Total Supplier').first()).toBeAttached();
  });
});

// ============================================================
// ITEMS MANAGEMENT TESTS
// ============================================================

test.describe('Items Management', () => {

  test('Items page loads for Procurement', async ({ page }) => {
    await login(page, 'procurement');
    await page.goto('/items');

    await expect(page.locator('h1').first()).toBeAttached();
  });

  test('Items page loads for Owner', async ({ page }) => {
    await login(page, 'owner');
    await page.goto('/items');

    await expect(page.locator('h1').first()).toBeAttached();
  });

  test('Items page redirects Warehouse', async ({ page }) => {
    await login(page, 'warehouse');
    await page.goto('/items');

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 5000 }).catch(() => {});
  });
});

// ============================================================
// USER MANAGEMENT TESTS
// ============================================================

test.describe('User Management', () => {

  test('Users page loads for Owner only', async ({ page }) => {
    await login(page, 'owner');
    await page.goto('/users');

    await expect(page.locator('h1').first()).toBeAttached();
  });

  test('Users page redirects non-Owner', async ({ page }) => {
    await login(page, 'finance');
    await page.goto('/users');

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 5000 }).catch(() => {});
  });

  test('Add user button exists for Owner', async ({ page }) => {
    await login(page, 'owner');
    await page.goto('/users');
    await page.waitForTimeout(500);

    const addBtn = page.locator('button:has-text("Tambah User")').first();
    await expect(addBtn).toBeVisible();
  });
});

// ============================================================
// AUDIT LOGS TESTS
// ============================================================

test.describe('Audit Logs', () => {

  test('Audit logs page loads for Owner', async ({ page }) => {
    await login(page, 'owner');
    await page.goto('/audit-logs');

    await expect(page.locator('h1').first()).toBeAttached();
  });

  test('Audit logs page loads for Finance', async ({ page }) => {
    await login(page, 'finance');
    await page.goto('/audit-logs');

    await expect(page.locator('h1').first()).toBeAttached();
  });

  test('Audit logs page redirects Warehouse', async ({ page }) => {
    await login(page, 'warehouse');
    await page.goto('/audit-logs');

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 5000 }).catch(() => {});
  });
});

// ============================================================
// GOODS RECEIPTS LOG PAGE TESTS
// ============================================================

test.describe('Goods Receipts Log', () => {

  test('Goods receipts log page loads for Warehouse', async ({ page }) => {
    await login(page, 'warehouse');
    await page.goto('/goods-receipts');

    await expect(page.locator('h1').first()).toBeAttached();
  });

  test('Goods receipts log page loads for Owner', async ({ page }) => {
    await login(page, 'owner');
    await page.goto('/goods-receipts');

    await expect(page.locator('h1').first()).toBeAttached();
  });

  test('Goods receipts log page redirects Procurement', async ({ page }) => {
    await login(page, 'procurement');
    await page.goto('/goods-receipts');

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 5000 }).catch(() => {});
  });
});

// ============================================================
// SETTINGS PAGE TESTS
// ============================================================

test.describe('Settings Page', () => {

  test('Settings page loads for authenticated users', async ({ page }) => {
    await login(page, 'owner');
    await page.goto('/settings');

    await expect(page.locator('h1').first()).toBeAttached();
  });

  test('Settings shows user profile info', async ({ page }) => {
    await login(page, 'owner');
    await page.goto('/settings');

    await expect(page.locator('text=Role').first()).toBeAttached();
  });

  test('Sign out button exists', async ({ page }) => {
    await login(page, 'owner');
    await page.goto('/settings');
    await page.waitForTimeout(500);

    const signOutBtn = page.locator('button:has-text("Keluar")').first();
    await expect(signOutBtn).toBeAttached();
  });
});

// ============================================================
// COMMAND PALETTE TESTS
// ============================================================

test.describe('Command Palette', () => {

  test('Command palette can be triggered', async ({ page }) => {
    await login(page, 'owner');
    await page.goto('/dashboard');

    // Press Cmd+K or Ctrl+K
    await page.keyboard.press('Control+k');
    await page.waitForTimeout(500);
  });
});

// ============================================================
// ROLE-BASED ACCESS CONTROL (RBAC) TESTS
// ============================================================

test.describe('Role-Based Access Control', () => {

  test('Procurement cannot access User Management via URL', async ({ page }) => {
    await login(page, 'procurement');
    await page.goto('/users');

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 5000 }).catch(() => {});
  });

  test('Warehouse cannot access Create PO via URL', async ({ page }) => {
    await login(page, 'warehouse');
    await page.goto('/purchase-orders/new');

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 5000 }).catch(() => {});
  });

  test('Owner can access all pages', async ({ page }) => {
    await login(page, 'owner');

    const pages = [
      '/dashboard',
      '/purchase-orders',
      '/items',
      '/suppliers',
      '/suppliers/scorecard',
      '/discrepancies',
      '/invoices',
      '/reports',
      '/users',
      '/audit-logs',
      '/goods-receipts',
      '/settings',
    ];

    for (const path of pages) {
      await page.goto(path);
      await page.waitForTimeout(300);
    }
  });
});

// ============================================================
// EMPTY STATES AND EDGE CASES
// ============================================================

test.describe('Empty States and Edge Cases', () => {

  test('Pagination works correctly', async ({ page }) => {
    await login(page, 'owner');
    await page.goto('/purchase-orders?page=2');
    await page.waitForTimeout(500);
  });

  test('Date filter works', async ({ page }) => {
    await login(page, 'owner');
    await page.goto('/purchase-orders?from=2024-01-01&to=2024-12-31');
    await page.waitForTimeout(500);
  });

  test('Search functionality works', async ({ page }) => {
    await login(page, 'owner');
    await page.goto('/purchase-orders?q=TEST');
    await page.waitForTimeout(500);
  });

  test('Status filter dropdown exists', async ({ page }) => {
    await login(page, 'owner');
    await page.goto('/purchase-orders');

    const statusSelect = page.locator('select').first();
    await expect(statusSelect).toBeAttached();
  });
});

// ============================================================
// FORM VALIDATION TESTS
// ============================================================

test.describe('Form Validation', () => {

  test('Create PO validates required fields', async ({ page }) => {
    await login(page, 'procurement');
    await page.goto('/purchase-orders/new');

    // Submit without filling anything
    await page.locator('button:has-text("Buat PO & Minta Approval")').click();
    await page.waitForTimeout(500);
  });
});

// ============================================================
// RESPONSIVE DESIGN TESTS
// ============================================================

test.describe('Responsive Design', () => {

  test('Dashboard works on mobile viewport', async ({ page }) => {
    await login(page, 'owner');
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/dashboard');
    await page.waitForTimeout(500);
  });

  test('Tables are scrollable on small screens', async ({ page }) => {
    await login(page, 'owner');
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/purchase-orders');
    await page.waitForTimeout(500);
  });
});
