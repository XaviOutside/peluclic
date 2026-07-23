import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth';

/**
 * E2E tests for the Appointments Calendar page.
 *
 * Assumptions:
 * - Frontend runs at http://localhost:5173
 * - Backend API runs with seeded data (docker compose up + npm run db:seed)
 *
 * Run: npx playwright test --grep "appointments"
 */

test.describe('appointments calendar', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/calendar');
    await page.waitForSelector('[data-testid="appointments-page"]');
    // Wait for calendar to finish loading (network idle after initial fetch)
    await page.waitForLoadState('networkidle');
  });

  test('displays the calendar grid with 7 day columns', async ({ page }) => {
    // Calendar week title h2 should contain month and year
    const weekTitle = page.locator('[data-testid="appointments-page"] h2');
    await expect(weekTitle).toContainText(/2026/);

    // Day name headers should be visible — the first .grid row has 7 column cells
    const dayHeaders = page.locator('[data-testid="appointments-page"] .grid:first-of-type > div');
    await expect(dayHeaders).toHaveCount(7, { timeout: 5000 });
  });

  test('opens the new appointment modal from the page header', async ({ page }) => {
    // Click the "New Appointment" / "Nueva Cita" button — use the page header button
    const newBtn = page.locator('[data-testid="appointments-page"] button:has-text("Cita"), [data-testid="appointments-page"] button:has-text("Appointment")').first();
    await newBtn.click();

    // Modal should appear — check for the modal heading which is either Spanish or English
    await expect(page.locator('h2:has-text("Cita"), h2:has-text("Appointment")').first()).toBeVisible({ timeout: 5000 });
  });

  test('navigates to next week and updates the URL', async ({ page }) => {
    // Click the next-week navigation — matches both "Next week" and "Semana siguiente"
    const nextBtn = page.locator('button:has-text("siguiente"), button:has-text("Next week")').first();
    await nextBtn.click();

    // URL should update with week param
    await expect(page).toHaveURL(/\/calendar\?week=/);
  });

  test('closes modal on cancel button', async ({ page }) => {
    // Open modal
    const newBtn = page.locator('[data-testid="appointments-page"] button:has-text("Cita"), [data-testid="appointments-page"] button:has-text("Appointment")').first();
    await newBtn.click();

    // Wait for modal heading
    const modalHeading = page.locator('h2:has-text("Cita"), h2:has-text("Appointment")').first();
    await expect(modalHeading).toBeVisible({ timeout: 5000 });

    // Click cancel — matches "Cancel" / "Cancelar"
    const cancelBtn = page.locator('button:has-text("Cancel")').first();
    await cancelBtn.click();

    // Modal should close
    await expect(modalHeading).not.toBeVisible({ timeout: 5000 });
  });
});
