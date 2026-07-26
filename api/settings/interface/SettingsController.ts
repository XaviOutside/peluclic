import type { Request, Response } from 'express';
import { logger } from '@api/observability/logger';
import { GetSettingsUseCase } from '../application/GetSettings';
import { UpdateSettingsUseCase } from '../application/UpdateSettings';
import { SettingsNotFoundError, SettingsValidationError } from '../domain/SettingsErrors';
import { toSettingsResponseDto } from './dtos/SettingsResponseDto';
import type { UpdateSettingsDto } from './dtos/UpdateSettingsDto';
import type { UpdateSettingsInput } from '../domain/CompanySettings';
import { MAX_LOGO_SIZE } from '../domain/CompanySettings';
import { randomUUID } from 'crypto';
import { LogoAssetRepository } from '../infrastructure/LogoAssetRepository';
import type { ISettingsRepository } from '../domain/ISettingsRepository';

/** Accepted logo MIME types — PNG only. */
const ALLOWED_LOGO_TYPES = new Set(['image/png']);

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
    private readonly settingsRepository: ISettingsRepository,
    private readonly logoAssetRepo: LogoAssetRepository,
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
   * Binary is stored in the logo_assets DB table (distributed-friendly).
   * The filename is a UUID and is persisted in CompanySettings.logoFilename.
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

      // Generate unique filename and persist to DB
      const filename = `logo-${randomUUID()}.png`;
      const asset = await this.logoAssetRepo.create(filename, file.buffer, file.mimetype, file.size);

      // Update settings to point to the new logo
      await this.settingsRepository.updateLogoFilename(filename);

      // Clean up old logo rows (keep only the latest)
      await this.logoAssetRepo.deleteOlderThan(asset.id);

      // Return updated settings with logoUrl
      const settings = await this.getSettingsUseCase.execute();
      res.status(200).json(toSettingsResponseDto(settings));
    } catch (err) {
      handleError(err, res);
    }
  }

  /** Serves the current company logo from the database. */
  async serveLogo(_req: Request, res: Response): Promise<void> {
    try {
      const settings = await this.settingsRepository.findSettings();
      if (!settings?.logoFilename) {
        res.status(404).json({ error: 'No logo uploaded' });
        return;
      }

      const asset = await this.logoAssetRepo.findByFilename(settings.logoFilename);
      if (!asset) {
        res.status(404).json({ error: 'No logo uploaded' });
        return;
      }

      res.setHeader('Content-Type', asset.mimeType);
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.send(asset.data);
    } catch (err) {
      handleError(err, res);
    }
  }
}
