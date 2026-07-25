import { test, expect, request as playwrightRequest } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth';

/**
 * E2E tests for the Appointments Calendar page.
 *
 * Run: npx playwright test --grep "appointments"
 */

test.describe('appointments calendar', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/calendar');
    await page.waitForSelector('[data-testid="appointments-page"]');
    await page.waitForLoadState('networkidle');
  });

  test('displays the calendar grid with 7 day columns', async ({ page }) => {
    const weekTitle = page.locator('[data-testid="appointments-page"] h2');
    await expect(weekTitle).toContainText(/2026/);

    const dayHeaders = page.locator('[data-testid="appointments-page"] .grid:first-of-type > div');
    await expect(dayHeaders).toHaveCount(7, { timeout: 5000 });
  });

  test('opens the new appointment modal from the page header', async ({ page }) => {
    const newBtn = page.locator('[data-testid="appointments-page"] button:has-text("Cita"), [data-testid="appointments-page"] button:has-text("Appointment")').first();
    await newBtn.click();

    await expect(page.locator('h2:has-text("Cita"), h2:has-text("Appointment")').first()).toBeVisible({ timeout: 5000 });
  });

  test('navigates to next week and updates the URL', async ({ page }) => {
    const nextBtn = page.locator('button:has-text("siguiente"), button:has-text("Next week")').first();
    await nextBtn.click();

    await expect(page).toHaveURL(/\/calendar\?week=/);
  });

  test('closes modal on cancel button', async ({ page }) => {
    const newBtn = page.locator('[data-testid="appointments-page"] button:has-text("Cita"), [data-testid="appointments-page"] button:has-text("Appointment")').first();
    await newBtn.click();

    const modalHeading = page.locator('h2:has-text("Cita"), h2:has-text("Appointment")').first();
    await expect(modalHeading).toBeVisible({ timeout: 5000 });

    const cancelBtn = page.locator('button:has-text("Cancel"), button:has-text("Cancelar")').first();
    await cancelBtn.click();

    await expect(modalHeading).not.toBeVisible({ timeout: 5000 });
  });
});

test.describe('appointments edit and cancel', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  /** Returns the next Monday from today. */
  function getNextMonday(): Date {
    const today = new Date();
    const daysUntilMonday = (8 - today.getUTCDay()) % 7 || 7;
    const nextMonday = new Date(today);
    nextMonday.setUTCDate(today.getUTCDate() + daysUntilMonday);
    return nextMonday;
  }

  /** Get an auth token for API calls. */
  async function getApiToken(): Promise<string> {
    const apiUrl = process.env['E2E_API_URL'] || 'http://localhost:3000';
    const ctx = await playwrightRequest.newContext({ baseURL: apiUrl });
    const res = await ctx.post('/api/v1/auth/login', {
      data: {
        email: process.env['E2E_ADMIN_EMAIL'],
        password: process.env['E2E_ADMIN_PASSWORD'],
      },
    });
    const body = await res.json();
    await ctx.dispose();
    if (!body.token) throw new Error(`Login failed: ${JSON.stringify(body)}`);
    return body.token;
  }

  /** Creates an appointment via the API. */
  async function createAppt(token: string, petId: number, scheduledAt: string, notes: string) {
    const apiUrl = process.env['E2E_API_URL'] || 'http://localhost:3000';
    const ctx = await playwrightRequest.newContext({ baseURL: apiUrl });
    const res = await ctx.post('/api/v1/appointments', {
      data: { petId, scheduledAt, notes },
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await res.json();
    await ctx.dispose();
    if (!res.ok()) throw new Error(`Create failed: ${JSON.stringify(body)}`);
    return body.id ?? body.data?.id;
  }

  test('opens edit modal when clicking a card', async ({ page }) => {
    const token = await getApiToken();
    const monday = getNextMonday();
    const dateStr = monday.toISOString().slice(0, 10);
    // Use a unique suffix to avoid conflicts across runs
    const suffix = Date.now() % 10000;
    const time = `${String(Math.floor(suffix / 60) % 24).padStart(2, '0')}:${String(suffix % 60).padStart(2, '0')}`;

    await createAppt(token, 1, `${dateStr}T${time}:00.000Z`, 'E2E edit');

    await page.goto(`/calendar?week=${dateStr}`);
    await page.waitForSelector('[data-testid="appointments-page"]');
    await page.waitForLoadState('networkidle');

    const card = page.locator('[data-testid="appointment-card"]').first();
    await expect(card).toBeVisible({ timeout: 10000 });
    await card.click();

    // Edit modal should appear
    await expect(page.locator('[data-testid="appointment-edit-modal"]')).toBeVisible({ timeout: 5000 });

    // Pet field should be readonly and pre-filled
    const petField = page.locator('[data-testid="appointment-pet-field"]');
    await expect(petField).toBeVisible();
    await expect(petField).not.toHaveValue('');
    await expect(petField).toHaveAttribute('readonly');

    // Modal has edit title
    await expect(page.locator('h2:has-text("Edit"), h2:has-text("Editar")').first()).toBeVisible();

    // Close via modal Cancel button (first button in edit modal = Cancel/Cancelar)
    const cancelBtn = page.locator('[data-testid="appointment-edit-modal"] button').first();
    await cancelBtn.click();
    await expect(page.locator('[data-testid="appointment-edit-modal"]')).not.toBeVisible({ timeout: 3000 });
  });

  test('cancel icon opens confirm dialog', async ({ page }) => {
    const token = await getApiToken();
    const monday = getNextMonday();
    const dateStr = monday.toISOString().slice(0, 10);
    const suffix = (Date.now() % 10000) + 100;
    const time = `${String(Math.floor(suffix / 60) % 24).padStart(2, '0')}:${String(suffix % 60).padStart(2, '0')}`;

    await createAppt(token, 1, `${dateStr}T${time}:00.000Z`, 'To cancel');

    await page.goto(`/calendar?week=${dateStr}`);
    await page.waitForSelector('[data-testid="appointments-page"]');
    await page.waitForLoadState('networkidle');

    // Click the cancel icon
    const cancelIcon = page.locator('[data-testid="appointment-cancel-icon"]').first();
    await expect(cancelIcon).toBeVisible({ timeout: 10000 });
    await cancelIcon.click();

    // Confirm dialog should appear
    await expect(page.locator('h2:has-text("Cancel Appointment"), h2:has-text("Cancelar Cita")')).toBeVisible({ timeout: 5000 });

    // Confirm the cancel
    await page.locator('button:has-text("Confirm"), button:has-text("Confirmar")').first().click();

    // Wait for refresh
    await page.waitForTimeout(500);
    await page.waitForLoadState('networkidle');

    // Dialog should be gone
    await expect(page.locator('h2:has-text("Cancel Appointment"), h2:has-text("Cancelar Cita")')).not.toBeVisible({ timeout: 3000 });
  });
});
