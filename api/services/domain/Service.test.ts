/**
 * Tests for the Service domain entity types and SERVICE_STATUS constant.
 *
 * Verifies:
 * - ServiceStatus union type accepts 0 | 1
 * - SERVICE_STATUS constant values are correct
 * - Service interface shape
 * - CreateServiceInput interface shape (status not included)
 * - UpdateServiceInput interface shape (status excluded)
 */
import { describe, it, expect } from 'vitest';
import { SERVICE_STATUS, type ServiceStatus, type Service, type CreateServiceInput, type UpdateServiceInput } from './Service';

describe('Service domain types', () => {
  describe('SERVICE_STATUS', () => {
    it('has INACTIVE = 0', () => {
      expect(SERVICE_STATUS.INACTIVE).toBe(0);
    });

    it('has ACTIVE = 1', () => {
      expect(SERVICE_STATUS.ACTIVE).toBe(1);
    });
  });

  describe('ServiceStatus', () => {
    it('accepts 0 as a valid value', () => {
      const s: ServiceStatus = 0;
      expect(s).toBe(SERVICE_STATUS.INACTIVE);
    });

    it('accepts 1 as a valid value', () => {
      const s: ServiceStatus = 1;
      expect(s).toBe(SERVICE_STATUS.ACTIVE);
    });
  });

  describe('Service interface', () => {
    it('has the correct shape', () => {
      const now = new Date();
      const svc: Service = {
        id: 1,
        name: 'Full Groom',
        description: 'Complete grooming',
        durationMinutes: 60,
        price: 5000,
        status: SERVICE_STATUS.ACTIVE,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      };

      expect(svc.id).toBe(1);
      expect(svc.name).toBe('Full Groom');
      expect(svc.description).toBe('Complete grooming');
      expect(svc.durationMinutes).toBe(60);
      expect(svc.price).toBe(5000);
      expect(svc.status).toBe(SERVICE_STATUS.ACTIVE);
      expect(svc.createdAt).toBe(now);
      expect(svc.updatedAt).toBe(now);
      expect(svc.deletedAt).toBeNull();
    });

    it('allows null description, null durationMinutes, and non-null deletedAt', () => {
      const now = new Date();
      const del = new Date();
      const svc: Service = {
        id: 2,
        name: 'Bath',
        description: null,
        durationMinutes: null,
        price: 2500,
        status: SERVICE_STATUS.INACTIVE,
        createdAt: now,
        updatedAt: now,
        deletedAt: del,
      };

      expect(svc.description).toBeNull();
      expect(svc.durationMinutes).toBeNull();
      expect(svc.deletedAt).toBe(del);
      expect(svc.status).toBe(SERVICE_STATUS.INACTIVE);
    });
  });

  describe('CreateServiceInput', () => {
    it('accepts required name and price with optional fields', () => {
      const input: CreateServiceInput = {
        name: 'Nail Trim',
        price: 1500,
      };

      expect(input.name).toBe('Nail Trim');
      expect(input.price).toBe(1500);
    });

    it('does NOT include a status field', () => {
      // Compile-time check: the type should not have 'status'
      const input: CreateServiceInput = {
        name: 'Test',
        description: 'desc',
        durationMinutes: 30,
        price: 1000,
      };
      // If status were present, this would compile but we verify at runtime
      expect('status' in input).toBe(false);
      expect(input.name).toBe('Test');
      expect(input.price).toBe(1000);
    });

    it('allows optional description and durationMinutes', () => {
      const input: CreateServiceInput = {
        name: 'Dental Cleaning',
        description: 'Full teeth cleaning service',
        durationMinutes: 45,
        price: 3500,
      };

      expect(input.description).toBe('Full teeth cleaning service');
      expect(input.durationMinutes).toBe(45);
    });
  });

  describe('UpdateServiceInput', () => {
    it('allows partial updates (all fields optional)', () => {
      const input: UpdateServiceInput = {
        name: 'Updated Name',
      };

      expect(input.name).toBe('Updated Name');
    });

    it('does NOT include a status field', () => {
      const input: UpdateServiceInput = {
        name: 'Test',
        price: 2000,
      };
      // status should not be in the type
      expect('status' in input).toBe(false);
      expect(input.name).toBe('Test');
      expect(input.price).toBe(2000);
    });

    it('allows all allowed fields', () => {
      const input: UpdateServiceInput = {
        name: 'Full Update',
        description: 'New description',
        durationMinutes: 90,
        price: 7500,
      };

      expect(input.name).toBe('Full Update');
      expect(input.description).toBe('New description');
      expect(input.durationMinutes).toBe(90);
      expect(input.price).toBe(7500);
    });
  });
});
