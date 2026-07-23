/**
 * User domain entity — zero framework or DB imports.
 * Role: 0 = admin, 1 = employee (TINYINT).
 * Status: 0 = inactive, 1 = active (TINYINT).
 */
export type UserRole = 0 | 1;
export type UserStatus = 0 | 1;

export const USER_ROLE = {
  ADMIN: 0 as UserRole,
  EMPLOYEE: 1 as UserRole,
} as const;

export const USER_STATUS = {
  INACTIVE: 0 as UserStatus,
  ACTIVE: 1 as UserStatus,
} as const;

export interface User {
  id: number;
  companyId: number;
  companyName: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}
