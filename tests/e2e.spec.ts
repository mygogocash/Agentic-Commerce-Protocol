import { test, expect } from '@playwright/test';

const SITE_URL = 'https://gogocash-acp.web.app';

test.describe('ACP E2E Health Checks', () => {

  test('Homepage loads', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Agentic Commerce/);
  });

  test('API: Search Protocol', async ({ request }) => {
    const response = await request.get('/api/searchProducts?query=iphone');
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty('results');
    expect(Array.isArray(data.results)).toBeTruthy();
  });

  test('API: OpenAPI Spec Exists', async ({ request }) => {
    const response = await request.get('/openapi.yaml');
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);
  });

});
