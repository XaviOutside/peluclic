import { describe, it, expect, beforeAll } from 'vitest';
import supertest from 'supertest';

// We import app before the module exists — this will be RED until T14 creates it
let app: Express.Application;

describe('Health endpoint', () => {
  beforeAll(async () => {
    // Dynamic import to defer resolution to test execution time
    const module = await import('./index');
    app = module.app;
  });

  it('GET /health responds 200 with { status: "ok" }', async () => {
    const response = await supertest(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });

  it('GET /unknown responds 404', async () => {
    const response = await supertest(app).get('/unknown-route-that-does-not-exist');
    expect(response.status).toBe(404);
  });
});
