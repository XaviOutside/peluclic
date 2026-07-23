import { type Page, request } from '@playwright/test';

const ADMIN_EMAIL = process.env['E2E_ADMIN_EMAIL'] ?? 'admin@peluclic.com';
const ADMIN_PASSWORD = process.env['E2E_ADMIN_PASSWORD'] ?? 'admin123';
const API_URL = process.env['E2E_API_URL'] ?? 'http://localhost:3000';

/**
 * Logs in via the API and stores the token in localStorage BEFORE the page loads.
 * This is faster and more reliable than navigating through the login page,
 * and avoids timing issues with redirects.
 */
export async function loginAsAdmin(page: Page): Promise<void> {
  // Call the login API directly
  const apiContext = await request.newContext({ baseURL: API_URL });
  const loginRes = await apiContext.post('/api/v1/auth/login', {
    data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });
  const body = await loginRes.json();
  await apiContext.dispose();

  if (!body.token) {
    throw new Error(`Login failed: ${JSON.stringify(body)}`);
  }

  // Inject token and user into localStorage before the page loads
  await page.addInitScript(({ token, user }: { token: string; user: unknown }) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  }, { token: body.token, user: body.user });
}
