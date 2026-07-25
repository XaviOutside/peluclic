import { describe, it, expect } from 'vitest';
import { Client, CreateClientInput, CLIENT_STATUS } from './Client';

describe('Client domain entity', () => {
  it('includes consentGivenAt in the entity', () => {
    const client: Client = {
      id: 1,
      name: 'Jane Doe',
      email: 'jane@example.com',
      phone: '555-0100',
      phone2: null,
      address: null,
      status: CLIENT_STATUS.ACTIVE,
      lastServiceDate: null,
      notes: null,
      createdAt: new Date('2026-01-01T00:00:00Z'),
      updatedAt: new Date('2026-01-01T00:00:00Z'),
      deletedAt: null,
      consentGivenAt: new Date('2026-07-25T10:00:00Z'),
    };

    expect(client.consentGivenAt).toBeInstanceOf(Date);
    expect(client.consentGivenAt.toISOString()).toBe('2026-07-25T10:00:00.000Z');
  });

  it('allows null consentGivenAt for existing clients', () => {
    const client: Client = {
      id: 2,
      name: 'Legacy Client',
      email: 'legacy@example.com',
      phone: '555-0200',
      phone2: null,
      address: null,
      status: CLIENT_STATUS.ACTIVE,
      lastServiceDate: null,
      notes: null,
      createdAt: new Date('2025-01-01T00:00:00Z'),
      updatedAt: new Date('2025-01-01T00:00:00Z'),
      deletedAt: null,
      consentGivenAt: null,
    };

    expect(client.consentGivenAt).toBeNull();
  });

  it('includes consentGivenAt in CreateClientInput', () => {
    const input: CreateClientInput = {
      name: 'New Client',
      email: 'new@example.com',
      phone: '555-0300',
      consentGivenAt: new Date('2026-07-25T10:00:00Z'),
    };

    expect(input.consentGivenAt).toBeInstanceOf(Date);
  });
});
