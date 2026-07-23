import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth';

/**
 * E2E tests for the Settings page.
 *
 * Assumptions:
 * - Frontend runs at http://localhost:5173
 * - Backend API runs with seeded data (docker compose up + npm run db:seed)
 *
 * Run: npx playwright test --grep "settings"
 */

test.describe('company settings', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/settings');
    await page.waitForSelector('[data-testid="settings-page"]');
    await page.waitForLoadState('networkidle');
  });

  test('displays the company name from the API on load', async ({ page }) => {
    const nameInput = page.locator('[data-testid="settings-company-name"]');
    // Verify a non-empty value loads from the API
    await expect(nameInput).not.toHaveValue('');
  });

  test('displays pre-populated workday toggles from the API', async ({ page }) => {
    // Mon–Fri should be checked (days 1–5)
    const monChip = page.locator('[data-testid="settings-workday-mon"]');
    const satChip = page.locator('[data-testid="settings-workday-sat"]');
    const sunChip = page.locator('[data-testid="settings-workday-sun"]');

    await expect(monChip).toHaveAttribute('aria-checked', 'true');
    // Sat/Sun workday state depends on current seed data — just verify they render
    await expect(satChip).toBeVisible();
    await expect(sunChip).toBeVisible();
  });

  test('displays pre-populated timetable from the API', async ({ page }) => {
    const startInput = page.locator('[data-testid="settings-start-time"]');
    const endInput = page.locator('[data-testid="settings-end-time"]');

    await expect(startInput).toHaveValue('09:00');
    await expect(endInput).not.toHaveValue('');
  });

  test('saves updated settings and shows success message', async ({ page }) => {
    const nameInput = page.locator('[data-testid="settings-company-name"]');
    await nameInput.fill('Paws Palace');

    // Click save
    await page.locator('[data-testid="settings-save"]').click();

    // Success feedback should appear
    await expect(page.locator('[data-testid="settings-feedback"]')).toBeVisible({ timeout: 5000 });
  });

  test('shows validation error with empty company name', async ({ page }) => {
    const nameInput = page.locator('[data-testid="settings-company-name"]');
    await nameInput.fill('');

    // Click save
    await page.locator('[data-testid="settings-save"]').click();

    // Validation error should appear
    await expect(page.locator('[data-testid="settings-company-name"]')).toHaveAttribute(
      'aria-invalid',
      'true',
    );
  });

  test('navigating to /settings after updating name shows the persisted value', async ({ page }) => {
    // First, update the name
    const nameInput = page.locator('[data-testid="settings-company-name"]');
    await nameInput.fill('Paws Palace');
    await page.locator('[data-testid="settings-save"]').click();
    await expect(page.locator('[data-testid="settings-feedback"]')).toBeVisible({ timeout: 5000 });

    // Navigate away and back
    await page.goto('/clients');
    await page.waitForTimeout(500);
    await page.goto('/settings');
    await page.waitForSelector('[data-testid="settings-page"]');

    // Should show the persisted name
    await expect(nameInput).toHaveValue('Paws Palace');
  });
});
