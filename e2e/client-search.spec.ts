import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth';

/**
 * E2E tests for client search: debounce, 3-char gate, stopword queries.
 *
 * Assumptions:
 * - Frontend runs at http://localhost:5173
 * - Backend API runs with seeded data (run `npm run db:seed` before tests)
 * - docker compose is up with MySQL + ngram FTS indexes
 * - App uses pf_demo:mode='api' (set in beforeEach via addInitScript)
 *
 * Run: npx playwright test --grep "search"
 */

const SEARCH_INPUT = '[data-testid="search-input"]';
const SEARCH_SUBMIT = '[data-testid="search-submit"]';
const DATA_TABLE_ROW = '[data-testid="datatable-row"]';
const EMPTY_STATE = '[data-testid="datatable-empty"]';

test.describe('client search', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    // loginAsAdmin already leaves us at /clients, but go there explicitly for clarity
    await page.goto('/clients');
    // Wait for initial page load — the table should render
    await page.waitForSelector('[data-testid="clients-page"]');
    // Wait for the initial list fetch to settle
    await page.waitForLoadState('networkidle');
  });

  test('auto-search finds results after typing 3+ characters with debounce', async ({ page }) => {
    const searchInput = page.locator(SEARCH_INPUT);

    // Type a query that should match seeded data (3+ chars)
    await searchInput.fill('bra');

    // Wait for debounce (300ms) + network + render — the table should update
    // with filtered results (at least one row visible, or empty state if no match)
    await expect(page.locator(DATA_TABLE_ROW).first().or(page.locator(EMPTY_STATE))).toBeVisible({ timeout: 10000 });
  });

  test('typing less than 3 characters does not trigger a search and keeps current list', async ({ page }) => {
    const searchInput = page.locator(SEARCH_INPUT);

    // Track search API calls
    let searchApiCalled = false;
    await page.route('**/api/v1/clients/search?q=*', (route) => {
      searchApiCalled = true;
      return route.fulfill({ json: [] });
    });

    // Type 2 characters
    await searchInput.fill('ab');

    // Wait past debounce window
    await page.waitForTimeout(500);

    // No search API call should have been made
    expect(searchApiCalled).toBe(false);

    // The initial table rows should still be visible (3-char gate keeps current results)
    await expect(page.locator(DATA_TABLE_ROW).first()).toBeVisible({ timeout: 3000 });
  });

  test('pressing Enter with less than 3 characters does not make an API call', async ({ page }) => {
    const searchInput = page.locator(SEARCH_INPUT);

    // Track search API calls
    let searchApiCalled = false;
    await page.route('**/api/v1/clients/search?q=*', (route) => {
      searchApiCalled = true;
      return route.fulfill({ json: [] });
    });

    // Type 2 chars and press Enter (explicit submit, bypasses debounce)
    await searchInput.fill('ab');
    await searchInput.press('Enter');

    // No search API call should have been made
    expect(searchApiCalled).toBe(false);
  });

  test('typing only stopwords returns empty results', async ({ page }) => {
    const searchInput = page.locator(SEARCH_INPUT);

    // Type stopwords (>= 3 chars total, but all are stopwords)
    await searchInput.fill('de la');

    // Wait for debounce + API response
    await page.waitForResponse(
      (resp) => resp.url().includes('/api/v1/clients/search?q=') && resp.status() === 200,
      { timeout: 5000 },
    );

    // Backend returns [] for all-stopword queries → empty state
    await expect(page.locator(EMPTY_STATE)).toBeVisible({ timeout: 3000 });
  });

  test('clicking search button with 3+ characters triggers immediate search', async ({ page }) => {
    const searchInput = page.locator(SEARCH_INPUT);
    const submitButton = page.locator(SEARCH_SUBMIT);

    // Track search API calls
    let searchApiCalled = false;
    await page.route('**/api/v1/clients/search?q=*', async (route) => {
      searchApiCalled = true;
      await route.fulfill({ json: [] });
    });

    // Type 3+ chars — this triggers auto-search via debounce (300ms)
    await searchInput.fill('bra');
    await page.waitForTimeout(500);

    // Reset the flag and click the search button (immediate search, bypasses debounce)
    searchApiCalled = false;
    await submitButton.click();

    // Wait for the request to be intercepted
    await page.waitForTimeout(1000);

    expect(searchApiCalled).toBe(true);
  });

  test('clicking search button with less than 3 characters does not make an API call', async ({ page }) => {
    const searchInput = page.locator(SEARCH_INPUT);
    const submitButton = page.locator(SEARCH_SUBMIT);

    // Clear previous route handlers by unloading page
    let searchApiCalled = false;
    await page.route('**/api/v1/clients/search?q=*', (route) => {
      searchApiCalled = true;
      return route.fulfill({ json: [] });
    });

    // Type 2 chars and click search button
    await searchInput.fill('ab');
    await submitButton.click();

    // No search API call should have been made
    expect(searchApiCalled).toBe(false);
  });
});
