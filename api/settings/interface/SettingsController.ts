import type { Request, Response } from 'express';
import { logger } from '@api/observability/logger';
import { GetSettingsUseCase } from '../application/GetSettings';
import { UpdateSettingsUseCase } from '../application/UpdateSettings';
import { SettingsNotFoundError, SettingsValidationError } from '../domain/SettingsErrors';
import { toSettingsResponseDto } from './dtos/SettingsResponseDto';
import type { UpdateSettingsDto } from './dtos/UpdateSettingsDto';
import type { UpdateSettingsInput } from '../domain/CompanySettings';
import { MAX_LOGO_SIZE } from '../domain/CompanySettings';
import { createWriteStream, existsSync, mkdirSync } from 'fs';
import { writeFile } from 'fs/promises';
import path from 'path';

/** Accepted logo MIME types — PNG only. */
const ALLOWED_LOGO_TYPES = new Set(['image/png']);
const UPLOADS_DIR = path.resolve('api/uploads');

/**
 * Maps domain errors to HTTP status codes and response bodies.
 * Unexpected errors return 500 with no stack trace in the body.
 */
function handleError(err: unknown, res: Response): void {
  if (err instanceof SettingsNotFoundError) {
    logger.warn({ errorName: err.name }, err.message);
    res.status(404).json({ error: err.message });
    return;
  }

  if (err instanceof SettingsValidationError) {
    logger.warn({ errorName: err.name }, err.message);
    res.status(422).json({ error: err.message });
    return;
  }

  const message = err instanceof Error ? err.message : 'Unknown error';
  logger.error({ errorName: err instanceof Error ? err.name : 'UnknownError' }, message);
  res.status(500).json({ error: 'Internal server error' });
}

export class SettingsController {
  constructor(
    private readonly getSettingsUseCase: GetSettingsUseCase,
    private readonly updateSettingsUseCase: UpdateSettingsUseCase,
  ) {}

  async getSettings(_req: Request, res: Response): Promise<void> {
    try {
      const settings = await this.getSettingsUseCase.execute();
      res.status(200).json(toSettingsResponseDto(settings));
    } catch (err) {
      handleError(err, res);
    }
  }

  async updateSettings(req: Request, res: Response): Promise<void> {
    try {
      const body = req.body as UpdateSettingsDto;

      // Coerce workdays to numbers and defaultLang to int
      const input: UpdateSettingsInput = {
        companyName: body.companyName,
        tagline: body.tagline ?? '',
        workdays: Array.isArray(body.workdays) ? body.workdays.map(Number) : body.workdays,
        workStartTime: body.workStartTime,
        workEndTime: body.workEndTime,
        defaultLang: typeof body.defaultLang === 'number' ? body.defaultLang as 0 | 1 : body.defaultLang,
      };

      const settings = await this.updateSettingsUseCase.execute(input);
      res.status(200).json(toSettingsResponseDto(settings));
    } catch (err) {
      handleError(err, res);
    }
  }

  /**
   * Uploads a company logo. Only PNG files ≤ 1 MB are accepted.
   * Existing logo is replaced. File is stored at api/uploads/logo.png.
   */
  async uploadLogo(req: Request, res: Response): Promise<void> {
    try {
      const file = req.file;

      if (!file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
      }

      // Validate MIME type
      if (!ALLOWED_LOGO_TYPES.has(file.mimetype)) {
        res.status(422).json({ error: 'Logo must be a PNG image' });
        return;
      }

      // Validate size
      if (file.size > MAX_LOGO_SIZE) {
        res.status(422).json({ error: 'Logo must be 1 MB or smaller' });
        return;
      }

      // Ensure uploads directory exists
      if (!existsSync(UPLOADS_DIR)) {
        mkdirSync(UPLOADS_DIR, { recursive: true });
      }

      // Write buffer to disk (replaces existing logo)
      const destPath = path.join(UPLOADS_DIR, 'logo.png');
      await writeFile(destPath, file.buffer);

      // Return updated settings with logoUrl
      const settings = await this.getSettingsUseCase.execute();
      res.status(200).json(toSettingsResponseDto(settings));
    } catch (err) {
      handleError(err, res);
    }
  }

  /** Serves the company logo file if it exists on disk. */
  serveLogo(_req: Request, res: Response): void {
    const logoPath = path.join(UPLOADS_DIR, 'logo.png');
    if (!existsSync(logoPath)) {
      res.status(404).json({ error: 'No logo uploaded' });
      return;
    }
    res.sendFile(logoPath);
  }
}
