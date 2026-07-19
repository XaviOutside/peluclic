import { Router } from 'express';
import type { Request, Response } from 'express';
import multer from 'multer';
import { SettingsController } from './SettingsController';
import { MAX_LOGO_SIZE } from '../domain/CompanySettings';

/**
 * Creates an Express Router for the settings bounded context.
 * Singleton resource — no :id param. Routes are:
 *   GET  /          → getSettings
 *   PUT  /          → updateSettings
 *   POST /logo      → uploadLogo (multipart, PNG ≤ 1MB)
 *   GET  /logo      → serveLogo
 */
export function createSettingsRouter(controller: SettingsController): Router {
  const router = Router();

  // Multer for logo upload — memory storage, 1 MB limit
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_LOGO_SIZE },
  });

  // GET  /api/v1/settings
  router.get('/', (req: Request, res: Response) =>
    controller.getSettings(req, res),
  );

  // PUT  /api/v1/settings
  router.put('/', (req: Request, res: Response) =>
    controller.updateSettings(req, res),
  );

  // POST /api/v1/settings/logo
  router.post('/logo', upload.single('logo'), (req: Request, res: Response) =>
    controller.uploadLogo(req, res),
  );

  // GET  /api/v1/settings/logo
  router.get('/logo', (req: Request, res: Response) =>
    controller.serveLogo(req, res),
  );

  return router;
}
