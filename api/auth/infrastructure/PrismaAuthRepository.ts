import crypto from 'crypto';
import { prisma } from '@api/shared/infrastructure/prisma';
import type { IAuthRepository } from '../domain/IAuthRepository';
import type { User } from '../domain/User';
import type { Session, SessionWithUser } from '../domain/Session';

/**
 * Prisma implementation of IAuthRepository.
 *
 * Uses the global prisma singleton. Methods return domain types only —
 * no Prisma model objects leak outside this class.
 *
 * findValidSession() performs three separate queries (session → user → company)
 * because Prisma relations are intentionally not defined in the schema
 * (no FK constraints per project rules).
 */
export class PrismaAuthRepository implements IAuthRepository {
  async findUserByEmail(email: string): Promise<User | null> {
    const row = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!row) return null;

    const company = await prisma.company.findUnique({ where: { id: row.companyId } });

    return this.mapToUser(row, company?.name ?? 'Unknown');
  }

  async createSession(
    userId: number,
    companyId: number,
    expiresAt: Date,
  ): Promise<Session> {
    const token = crypto.randomUUID();

    const row = await prisma.session.create({
      data: {
        token,
        userId,
        companyId,
        expiresAt,
      },
    });

    return this.mapToSession(row);
  }

  async findValidSession(token: string): Promise<SessionWithUser | null> {
    const sessionRow = await prisma.session.findFirst({
      where: {
        token,
        deletedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (!sessionRow) return null;

    const user = await prisma.user.findUnique({ where: { id: sessionRow.userId } });
    if (!user) return null;

    const company = await prisma.company.findUnique({ where: { id: sessionRow.companyId } });
    if (!company) return null;

    return {
      token: sessionRow.token,
      userId: sessionRow.userId,
      role: user.role,
      companyId: sessionRow.companyId,
      companyName: company.name,
      expiresAt: sessionRow.expiresAt,
    };
  }

  async invalidateSession(token: string): Promise<void> {
    // Use updateMany for idempotent soft-delete — no error if token doesn't exist
    await prisma.session.updateMany({
      where: { token },
      data: { deletedAt: new Date() },
    });
  }

  private mapToUser(
    row: {
      id: number;
      companyId: number;
      email: string;
      passwordHash: string;
      role: number;
      status: number;
      createdAt: Date;
      updatedAt: Date;
      deletedAt: Date | null;
    },
    companyName: string,
  ): User {
    return {
      id: row.id,
      companyId: row.companyId,
      companyName,
      email: row.email,
      passwordHash: row.passwordHash,
      role: row.role as User['role'],
      status: row.status as User['status'],
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  private mapToSession(row: {
    id: number;
    token: string;
    userId: number;
    companyId: number;
    expiresAt: Date;
    createdAt: Date;
    deletedAt: Date | null;
  }): Session {
    return {
      id: row.id,
      token: row.token,
      userId: row.userId,
      companyId: row.companyId,
      expiresAt: row.expiresAt,
      createdAt: row.createdAt,
      deletedAt: row.deletedAt,
    };
  }
}
