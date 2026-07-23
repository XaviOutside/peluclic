import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth';

/**
 * E2E tests for pet CRUD operations (list, create, read, update, deactivate).
 *
 * Run: npx playwright test --grep "pets CRUD"
 */

test.describe('pets CRUD', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('list — page loads with pet rows visible', async ({ page }) => {
    await page.goto('/pets');
    await page.waitForSelector('[data-testid="pets-page"]');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-testid="datatable-row"]').first()).toBeVisible();
  });

  test('create — fills form, selects client, submits, redirects to detail', async ({ page }) => {
    await page.goto('/pets');
    await page.waitForSelector('[data-testid="pets-page"]');
    await page.waitForLoadState('networkidle');

    await page
      .locator('button:has-text("Añadir mascota"), button:has-text("Add pet")')
      .click();
    await expect(page).toHaveURL(/\/pets\/new/);

    const uniqueSuffix = Date.now();
    const petName = `E2E Pet ${uniqueSuffix}`;

    await page.getByLabel('Name').fill(petName);
    await page.getByLabel('Species').fill('Dog');
    await page.getByLabel('Breed').fill('Labrador');

    // Select the first client from the Client dropdown
    await page.getByLabel('Client').selectOption({ index: 1 });

    await page
      .locator('button:has-text("Crear"), button:has-text("Create")')
      .click();

    await expect(page).toHaveURL(/\/pets\/\d+$/);
    await expect(page.locator('h2:has-text("' + petName + '")')).toBeVisible();
  });

  test('read — navigates to pet detail via view action', async ({ page }) => {
    await page.goto('/pets');
    await page.waitForSelector('[data-testid="pets-page"]');
    await page.waitForLoadState('networkidle');

    const firstRow = page.locator('[data-testid="datatable-row"]').first();
    await firstRow.locator('[data-testid="row-action-view"]').click();

    await expect(page).toHaveURL(/\/pets\/\d+$/);
    // Detail page renders a heading with the pet name
    await expect(page.locator('h2').first()).toBeVisible();
  });

  test('update — edits pet name and redirects to detail', async ({ page }) => {
    await page.goto('/pets');
    await page.waitForSelector('[data-testid="pets-page"]');
    await page.waitForLoadState('networkidle');

    const firstRow = page.locator('[data-testid="datatable-row"]').first();
    await firstRow.locator('[data-testid="row-action-edit"]').click();
    await expect(page).toHaveURL(/\/pets\/\d+\/edit/);

    const newName = `E2E Updated Pet ${Date.now()}`;
    await page.getByLabel('Name').fill(newName);

    await page
      .locator('button:has-text("Actualizar"), button:has-text("Update")')
      .click();

    await expect(page).toHaveURL(/\/pets\/\d+$/);
    await expect(page.locator('h2:has-text("' + newName + '")')).toBeVisible();
  });

  test('deactivate — deactivates a pet and shows feedback toast', async ({ page }) => {
    await page.goto('/pets');
    await page.waitForSelector('[data-testid="pets-page"]');
    await page.waitForLoadState('networkidle');

    const firstRow = page.locator('[data-testid="datatable-row"]').first();
    await firstRow.locator('[data-testid="row-action-deactivate"]').click();

    await page
      .locator('[role="dialog"] button:has-text("Desactivar"), [role="dialog"] button:has-text("Deactivate")')
      .click();

    await expect(page.locator('[data-testid="feedback-toast"]')).toBeVisible();
  });
});
