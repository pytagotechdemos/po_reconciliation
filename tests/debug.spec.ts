import { test, expect } from '@playwright/test';

test('Debug dashboard content', async ({ page }) => {
  // Get CSRF token
  const csrfResponse = await page.request.get('/api/auth/csrf');
  const csrfData = await csrfResponse.json();

  // Make the login request
  const loginResponse = await page.request.post('/api/auth/callback/credentials', {
    data: {
      username: 'owner',
      password: 'password123',
      csrfToken: csrfData.csrfToken,
      redirect: false,
    }
  });

  // Access dashboard
  await page.goto('/dashboard');
  await page.waitForLoadState('domcontentloaded');

  // Verify dashboard loaded
  await expect(page.locator('text=Dashboard Overview')).toBeVisible({ timeout: 30000 });
});
