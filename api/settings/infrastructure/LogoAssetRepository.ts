import { prisma } from '@api/shared/infrastructure/prisma';

export interface LogoAssetRow {
  id: number;
  filename: string;
  data: Buffer;
  mimeType: string;
  size: number;
  createdAt: Date;
}

/**
 * Repository for logo binary storage in the logo_assets table.
 * Enables distributed deployments — logo is in the DB, not the filesystem.
 */
export class LogoAssetRepository {
  /**
   * Saves a new logo binary and returns the created row.
   * Old rows for the same company are NOT deleted here —
   * the caller is responsible for cleanup.
   */
  async create(filename: string, data: Buffer, mimeType: string, size: number): Promise<LogoAssetRow> {
    const row = await prisma.logoAsset.create({
      data: { filename, data, mimeType, size },
    });
    return {
      id: row.id,
      filename: row.filename,
      data: row.data,
      mimeType: row.mimeType,
      size: row.size,
      createdAt: row.createdAt,
    };
  }

  /** Returns the logo asset for the given filename, or null. */
  async findByFilename(filename: string): Promise<LogoAssetRow | null> {
    const row = await prisma.logoAsset.findFirst({
      where: { filename },
    });
    if (!row) return null;
    return {
      id: row.id,
      filename: row.filename,
      data: row.data,
      mimeType: row.mimeType,
      size: row.size,
      createdAt: row.createdAt,
    };
  }

  /** Deletes logo assets older than the given row id (keeps only the latest). */
  async deleteOlderThan(id: number): Promise<void> {
    await prisma.logoAsset.deleteMany({
      where: { id: { lt: id } },
    });
  }
}
