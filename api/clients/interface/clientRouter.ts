import { Router } from 'express';
import type { Request, Response } from 'express';
import { ClientController } from './ClientController';

/**
 * Creates an Express Router for the clients bounded context.
 * Routes are bound to a pre-constructed ClientController instance,
 * enabling dependency injection and making the router testable.
 *
 * Route order matters:
 *   GET /search MUST be declared before GET /:id to avoid "search" being
 *   interpreted as an :id parameter.
 */
export function createClientRouter(controller: ClientController): Router {
  const router = Router();

  // POST   /api/v1/clients
  router.post('/', (req: Request, res: Response) =>
    controller.createClient(req, res),
  );

  // GET    /api/v1/clients
  router.get('/', (req: Request, res: Response) =>
    controller.listClients(req, res),
  );

  // GET    /api/v1/clients/search  — MUST be declared before /:id
  router.get('/search', (req: Request, res: Response) =>
    controller.searchClients(req, res),
  );

  // GET    /api/v1/clients/:id
  router.get('/:id', (req: Request, res: Response) =>
    controller.getClient(req, res),
  );

  // PUT    /api/v1/clients/:id
  router.put('/:id', (req: Request, res: Response) =>
    controller.updateClient(req, res),
  );

  // PATCH  /api/v1/clients/:id/deactivate
  router.patch('/:id/deactivate', (req: Request, res: Response) =>
    controller.deactivateClient(req, res),
  );

  // PATCH  /api/v1/clients/:id/reactivate
  router.patch('/:id/reactivate', (req: Request, res: Response) =>
    controller.reactivateClient(req, res),
  );

  // DELETE /api/v1/clients/:id
  router.delete('/:id', (req: Request, res: Response) =>
    controller.deleteClient(req, res),
  );

  return router;
}
