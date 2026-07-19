/**
 * Supertest tests for SettingsController routes.
 * Use cases are mocked — no DB connection required.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { SettingsController } from './SettingsController';
import { createSettingsRouter } from './settingsRouter';
import { SettingsNotFoundError, SettingsValidationError } from '../domain/SettingsErrors';
import type { GetSettingsUseCase } from '../application/GetSettings';
import type { UpdateSettingsUseCase } from '../application/UpdateSettings';

const domainSettings = {
  id: 1,
  companyName: 'Bark & Bubbles',
  tagline: null as string | null,
  workdays: [1, 2, 3, 4, 5],
  workStartTime: '09:00',
  workEndTime: '17:00',
  defaultLang: 0 as const,
  createdAt: new Date('2026-07-19T00:00:00.000Z'),
  updatedAt: new Date('2026-07-19T00:00:00.000Z'),
};

const expectedDto = {
  id: 1,
  companyName: 'Bark & Bubbles',
  tagline: null,
  workdays: [1, 2, 3, 4, 5],
  workStartTime: '09:00',
  workEndTime: '17:00',
  defaultLang: 0,
  logoUrl: null,
  createdAt: '2026-07-19T00:00:00.000Z',
  updatedAt: '2026-07-19T00:00:00.000Z',
};

const validBody = {
  companyName: 'New Name',
  workdays: [1, 2, 3, 4, 5],
  workStartTime: '08:00',
  workEndTime: '18:00',
  defaultLang: 1,
};

// Mock use case instances
const mockGetSettings = { execute: vi.fn() } as unknown as GetSettingsUseCase;
const mockUpdateSettings = { execute: vi.fn() } as unknown as UpdateSettingsUseCase;

function createApp() {
  const controller = new SettingsController(mockGetSettings, mockUpdateSettings);
  const app = express();
  app.use(express.json());
  app.use('/api/v1/settings', createSettingsRouter(controller));
  return app;
}

// ─── GET /api/v1/settings ────────────────────────────────────────────────────

describe('GET /api/v1/settings', () => {
  let app: express.Express;

  beforeEach(() => {
    vi.clearAllMocks();
    app = createApp();
  });

  it('returns 200 with settings DTO', async () => {
    vi.mocked(mockGetSettings.execute).mockResolvedValue(domainSettings);

    const res = await request(app).get('/api/v1/settings');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expectedDto);
  });

  it('returns 404 when settings not found', async () => {
    vi.mocked(mockGetSettings.execute).mockRejectedValue(new SettingsNotFoundError());

    const res = await request(app).get('/api/v1/settings');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Company settings not found' });
  });

  it('returns 500 on unexpected error', async () => {
    vi.mocked(mockGetSettings.execute).mockRejectedValue(new Error('DB crash'));

    const res = await request(app).get('/api/v1/settings');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Internal server error' });
  });
});

// ─── PUT /api/v1/settings ────────────────────────────────────────────────────

describe('PUT /api/v1/settings', () => {
  let app: express.Express;

  beforeEach(() => {
    vi.clearAllMocks();
    app = createApp();
  });

  it('returns 200 with updated settings on valid input', async () => {
    const updated = { ...domainSettings, companyName: 'New Name', defaultLang: 1 as const };
    vi.mocked(mockUpdateSettings.execute).mockResolvedValue(updated);

    const res = await request(app)
      .put('/api/v1/settings')
      .send(validBody)
      .set('Content-Type', 'application/json');

    expect(res.status).toBe(200);
    expect(res.body.companyName).toBe('New Name');
    expect(res.body.defaultLang).toBe(1);
  });

  it('returns 422 when validation fails', async () => {
    vi.mocked(mockUpdateSettings.execute).mockRejectedValue(
      new SettingsValidationError('companyName must be 1–200 characters'),
    );

    const res = await request(app)
      .put('/api/v1/settings')
      .send({ ...validBody, companyName: '' })
      .set('Content-Type', 'application/json');

    expect(res.status).toBe(422);
    expect(res.body.error).toContain('companyName');
  });

  it('returns 500 on unexpected error during update', async () => {
    vi.mocked(mockUpdateSettings.execute).mockRejectedValue(new Error('DB crash'));

    const res = await request(app)
      .put('/api/v1/settings')
      .send(validBody)
      .set('Content-Type', 'application/json');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Internal server error' });
  });
});
