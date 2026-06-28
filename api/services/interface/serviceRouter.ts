import { Router } from 'express';
import type { Request, Response } from 'express';
import { ServiceController } from './ServiceController';

/**
 * Creates an Express Router for the services bounded context.
 * Routes are bound to a pre-constructed ServiceController instance,
 * enabling dependency injection and making the router testable.
 *
 * Route order matters:
 *   GET /search MUST be declared before GET /:id to avoid "search" being
 *   interpreted as an :id parameter.
 */
export function createServiceRouter(controller: ServiceController): Router {
  const router = Router();

  // POST   /api/v1/services
  router.post('/', (req: Request, res: Response) =>
    controller.createService(req, res),
  );

  // GET    /api/v1/services/search  — MUST be declared before /:id
  router.get('/search', (req: Request, res: Response) =>
    controller.searchServices(req, res),
  );

  // GET    /api/v1/services
  router.get('/', (req: Request, res: Response) =>
    controller.listServices(req, res),
  );

  // GET    /api/v1/services/:id
  router.get('/:id', (req: Request, res: Response) =>
    controller.getService(req, res),
  );

  // PUT    /api/v1/services/:id
  router.put('/:id', (req: Request, res: Response) =>
    controller.updateService(req, res),
  );

  // PATCH  /api/v1/services/:id/deactivate
  router.patch('/:id/deactivate', (req: Request, res: Response) =>
    controller.deactivateService(req, res),
  );

  // DELETE /api/v1/services/:id
  router.delete('/:id', (req: Request, res: Response) =>
    controller.deleteService(req, res),
  );

  return router;
}
