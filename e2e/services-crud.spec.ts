import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth';

/**
 * E2E tests for service CRUD operations (list, create, read, update, deactivate).
 *
 * Run: npx playwright test --grep "services CRUD"
 */

test.describe('services CRUD', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('list — page loads with service rows visible', async ({ page }) => {
    await page.goto('/services');
    await page.waitForSelector('[data-testid="services-page"]');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-testid="datatable-row"]').first()).toBeVisible();
  });

  test('create — fills form and redirects to detail page', async ({ page }) => {
    await page.goto('/services');
    await page.waitForSelector('[data-testid="services-page"]');
    await page.waitForLoadState('networkidle');

    await page
      .locator('button:has-text("Nuevo servicio"), button:has-text("New service")')
      .click();
    await expect(page).toHaveURL(/\/services\/new/);

    const uniqueSuffix = Date.now();
    const serviceName = `E2E Service ${uniqueSuffix}`;

    await page.getByLabel('Name').fill(serviceName);
    await page.getByLabel('Price ($)').fill('35.00');

    await page
      .locator('button:has-text("Crear"), button:has-text("Create")')
      .click();

    await expect(page).toHaveURL(/\/services\/\d+$/);
    await expect(page.locator('h2:has-text("' + serviceName + '")')).toBeVisible();
  });

  test('read — navigates to service detail via view action', async ({ page }) => {
    await page.goto('/services');
    await page.waitForSelector('[data-testid="services-page"]');
    await page.waitForLoadState('networkidle');

    const firstRow = page.locator('[data-testid="datatable-row"]').first();
    await firstRow.locator('[data-testid="row-action-view"]').click();

    await expect(page).toHaveURL(/\/services\/\d+$/);
    // Detail page renders a heading with the service name
    await expect(page.locator('h2').first()).toBeVisible();
  });

  test('update — edits service name and redirects to detail', async ({ page }) => {
    await page.goto('/services');
    await page.waitForSelector('[data-testid="services-page"]');
    await page.waitForLoadState('networkidle');

    const firstRow = page.locator('[data-testid="datatable-row"]').first();
    await firstRow.locator('[data-testid="row-action-edit"]').click();
    await expect(page).toHaveURL(/\/services\/\d+\/edit/);

    const newName = `E2E Updated Service ${Date.now()}`;
    await page.getByLabel('Name').fill(newName);

    await page
      .locator('button:has-text("Actualizar"), button:has-text("Update")')
      .click();

    await expect(page).toHaveURL(/\/services\/\d+$/, { timeout: 15000 });
    // Detail page renders service name in the card header
    await expect(page.locator('h2').first()).toBeVisible();
  });

  test('deactivate — deactivates a service and shows feedback toast', async ({ page }) => {
    await page.goto('/services');
    await page.waitForSelector('[data-testid="services-page"]');
    await page.waitForLoadState('networkidle');

    const firstRow = page.locator('[data-testid="datatable-row"]').first();
    await firstRow.locator('[data-testid="row-action-delete"]').click();

    await page
      .locator('[role="dialog"] button:has-text("Eliminar"), [role="dialog"] button:has-text("Delete")')
      .click();

    await expect(page.locator('[data-testid="feedback-toast"]')).toBeVisible();
  });
});
