import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth';

/**
 * E2E tests for client CRUD operations (list, create, read, update, deactivate).
 *
 * Run: npx playwright test --grep "clients CRUD"
 */

test.describe('clients CRUD', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('list — page loads with client rows visible', async ({ page }) => {
    await page.goto('/clients');
    await page.waitForSelector('[data-testid="clients-page"]');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-testid="datatable-row"]').first()).toBeVisible();
  });

  test('create — fills form and redirects to detail page', async ({ page }) => {
    await page.goto('/clients');
    await page.waitForSelector('[data-testid="clients-page"]');
    await page.waitForLoadState('networkidle');

    await page
      .locator('button:has-text("Añadir cliente"), button:has-text("Add client")')
      .click();
    await expect(page).toHaveURL(/\/clients\/new/);

    const uniqueSuffix = Date.now();
    const testName = `E2E Create ${uniqueSuffix}`;

    await page.getByLabel(/name|nombre/i).fill(testName);
    await page.getByLabel(/email|correo/i).fill(`e2e-create-${uniqueSuffix}@test.com`);
    await page.getByLabel(/phone|teléfono/i).first().fill('555-0100');

    // GDPR consent checkbox — required since Art. 7 compliance
    await page.getByRole('checkbox').check({ force: true });

    await page
      .locator('button:has-text("Crear"), button:has-text("Create")')
      .click();

    await expect(page).toHaveURL(/\/clients\/\d+$/);
    await expect(page.locator('h2:has-text("' + testName + '")')).toBeVisible();
  });

  test('read — navigates to client detail via view action', async ({ page }) => {
    await page.goto('/clients');
    await page.waitForSelector('[data-testid="clients-page"]');
    await page.waitForLoadState('networkidle');

    const firstRow = page.locator('[data-testid="datatable-row"]').first();
    const clientName = await firstRow.locator('.font-semibold').first().textContent();

    await firstRow.locator('[data-testid="row-action-view"]').click();
    await expect(page).toHaveURL(/\/clients\/\d+$/);
    await expect(page.locator('h2').first()).toBeVisible();

    if (clientName) {
      await expect(page.locator('h2:has-text("' + clientName.trim() + '")')).toBeVisible();
    }
  });

  test('update — edits client name and redirects to detail', async ({ page }) => {
    await page.goto('/clients');
    await page.waitForSelector('[data-testid="clients-page"]');
    await page.waitForLoadState('networkidle');

    const firstRow = page.locator('[data-testid="datatable-row"]').first();
    await firstRow.locator('[data-testid="row-action-edit"]').click();
    await expect(page).toHaveURL(/\/clients\/\d+\/edit/);

    const newName = `E2E Updated ${Date.now()}`;
    await page.getByLabel(/name|nombre/i).fill(newName);

    // Ensure GDPR consent checkbox is checked (may be pre-checked for existing clients)
    const checkbox = page.getByRole('checkbox');
    if (await checkbox.isVisible()) {
      const isChecked = await checkbox.isChecked();
      if (!isChecked) {
        await checkbox.check({ force: true });
      }
    }

    await page
      .locator('button:has-text("Actualizar"), button:has-text("Update")')
      .click();

    await expect(page).toHaveURL(/\/clients\/\d+$/);
    await expect(page.locator('h2:has-text("' + newName + '")')).toBeVisible();
  });

  test('deactivate — deactivates a client and shows feedback toast', async ({ page }) => {
    await page.goto('/clients');
    await page.waitForSelector('[data-testid="clients-page"]');
    await page.waitForLoadState('networkidle');

    const firstRow = page.locator('[data-testid="datatable-row"]').first();
    await firstRow.locator('[data-testid="row-action-delete"]').click();

    await page
      .locator('[role="dialog"] button:has-text("Desactivar"), [role="dialog"] button:has-text("Deactivate")')
      .click();

    await expect(page.locator('[data-testid="feedback-toast"]')).toBeVisible();
  });

  test('hard-delete — creates client, deletes permanently, confirms redirect', async ({ page }) => {
    // 1. Create a unique client
    await page.goto('/clients/new');
    await page.waitForLoadState('networkidle');

    const uniqueSuffix = Date.now();
    const testName = `E2E HardDelete ${uniqueSuffix}`;

    await page.getByLabel(/name|nombre/i).fill(testName);
    await page.getByLabel(/email|correo/i).fill(`e2e-harddelete-${uniqueSuffix}@test.com`);
    await page.getByLabel(/phone|teléfono/i).first().fill('555-0200');
    await page.getByRole('checkbox').check({ force: true });

    await page
      .locator('button:has-text("Crear"), button:has-text("Create")')
      .click();

    await expect(page).toHaveURL(/\/clients\/\d+$/);
    await expect(page.locator('h2:has-text("' + testName + '")')).toBeVisible();

    // 2. Click "Eliminar Permanentemente" button
    await page
      .locator('button:has-text("Eliminar Permanentemente"), button:has-text("Delete Permanently")')
      .click();

    // 3. Verify the confirmation modal appears with correct content
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('h2:has-text("Eliminar Permanentemente"), h2:has-text("Delete Permanently")')).toBeVisible();
    await expect(dialog.locator('text=' + testName)).toBeVisible();

    // 4. Confirm the hard deletion
    await dialog
      .locator('button:has-text("Eliminar para Siempre"), button:has-text("Delete Forever")')
      .click();

    // 5. Verify redirect to clients list
    await expect(page).toHaveURL(/\/clients$/);
    await page.waitForSelector('[data-testid="clients-page"]');
  });
});
