import { useMemo } from 'react';

interface StoredUser {
  id: number;
  email: string;
  role: 'admin' | 'employee';
}

function getStoredUser(): StoredUser | null {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed.id === 'number' &&
      typeof parsed.email === 'string' &&
      (parsed.role === 'admin' || parsed.role === 'employee')
    ) {
      return parsed as StoredUser;
    }
    return null;
  } catch {
    return null;
  }
}

export function useUser() {
  return useMemo(() => getStoredUser(), []);
}
