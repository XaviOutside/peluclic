import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
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

  // Multer error handler — catches LIMIT_FILE_SIZE before it reaches the controller
  const uploadWithErrorHandling = (req: Request, res: Response, next: NextFunction): void => {
    upload.single('logo')(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
          res.status(422).json({ error: 'Logo must be 1 MB or smaller' });
          return;
        }
        next(err);
        return;
      }
      next();
    });
  };

  // GET  /api/v1/settings
  router.get('/', (req: Request, res: Response) =>
    controller.getSettings(req, res),
  );

  // PUT  /api/v1/settings
  router.put('/', (req: Request, res: Response) =>
    controller.updateSettings(req, res),
  );

  // POST /api/v1/settings/logo
  router.post('/logo', uploadWithErrorHandling, (req: Request, res: Response) =>
    controller.uploadLogo(req, res),
  );

  // GET  /api/v1/settings/logo
  router.get('/logo', (req: Request, res: Response) =>
    controller.serveLogo(req, res),
  );

  return router;
}
