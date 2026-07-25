import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useUser } from './useUser';

describe('useUser', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('returns admin role when localStorage has role=admin', () => {
    const user = {
      id: 1,
      email: 'admin@example.com',
      role: 'admin' as const,
    };
    localStorage.setItem('user', JSON.stringify(user));

    const { result } = renderHook(() => useUser());

    expect(result.current).toEqual(user);
    expect(result.current?.role).toBe('admin');
  });

  it('returns employee role when localStorage has role=employee', () => {
    const user = {
      id: 2,
      email: 'employee@example.com',
      role: 'employee' as const,
    };
    localStorage.setItem('user', JSON.stringify(user));

    const { result } = renderHook(() => useUser());

    expect(result.current).toEqual(user);
    expect(result.current?.role).toBe('employee');
  });

  it('returns null when no user in localStorage', () => {
    const { result } = renderHook(() => useUser());

    expect(result.current).toBeNull();
  });

  it('returns null when stored value is not valid JSON', () => {
    localStorage.setItem('user', 'not-valid-json');

    const { result } = renderHook(() => useUser());

    expect(result.current).toBeNull();
  });

  it('returns null when stored user has invalid role', () => {
    const user = {
      id: 3,
      email: 'unknown@example.com',
      role: 'guest',
    };
    localStorage.setItem('user', JSON.stringify(user));

    const { result } = renderHook(() => useUser());

    expect(result.current).toBeNull();
  });

  it('returns null when stored user has non-numeric id', () => {
    const user = {
      id: 'not-a-number',
      email: 'bad@example.com',
      role: 'admin',
    };
    localStorage.setItem('user', JSON.stringify(user));

    const { result } = renderHook(() => useUser());

    expect(result.current).toBeNull();
  });
});
