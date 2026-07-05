import 'dotenv/config';
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { logger } from './observability/logger';
import { PrismaClientRepository } from './clients/infrastructure/PrismaClientRepository';
import { CreateClientUseCase } from './clients/application/CreateClient';
import { GetClientUseCase } from './clients/application/GetClient';
import { ListClientsUseCase } from './clients/application/ListClients';
import { UpdateClientUseCase } from './clients/application/UpdateClient';
import { DeactivateClientUseCase } from './clients/application/DeactivateClient';
import { SoftDeleteClientUseCase } from './clients/application/SoftDeleteClient';
import { SearchClientsUseCase } from './clients/application/SearchClients';
import { ClientController } from './clients/interface/ClientController';
import { createClientRouter } from './clients/interface/clientRouter';
import { PrismaPetRepository } from './pets/infrastructure/PrismaPetRepository';
import { CreatePetUseCase } from './pets/application/CreatePet';
import { GetPetUseCase } from './pets/application/GetPet';
import { ListPetsUseCase } from './pets/application/ListPets';
import { UpdatePetUseCase } from './pets/application/UpdatePet';
import { DeactivatePetUseCase } from './pets/application/DeactivatePet';
import { SoftDeletePetUseCase } from './pets/application/SoftDeletePet';
import { SearchPetsUseCase } from './pets/application/SearchPets';
import { PetController } from './pets/interface/PetController';
import { createPetRouter } from './pets/interface/petRouter';
import { PrismaServiceRepository } from './services/infrastructure/PrismaServiceRepository';
import { CreateServiceUseCase } from './services/application/CreateService';
import { GetServiceUseCase } from './services/application/GetService';
import { ListServicesUseCase } from './services/application/ListServices';
import { UpdateServiceUseCase } from './services/application/UpdateService';
import { DeactivateServiceUseCase } from './services/application/DeactivateService';
import { SoftDeleteServiceUseCase } from './services/application/SoftDeleteService';
import { SearchServicesUseCase } from './services/application/SearchServices';
import { ServiceController } from './services/interface/ServiceController';
import { createServiceRouter } from './services/interface/serviceRouter';

// Validate required environment variables at startup (skip in test environment)
if (process.env['NODE_ENV'] !== 'test' && !process.env['DATABASE_URL']) {
  logger.error('DATABASE_URL environment variable is required but not set');
  process.exit(1);
}

const app = express();

// Security: don't disclose framework version
app.disable('x-powered-by');

// Security headers (CSP, X-Frame-Options, X-Content-Type-Options, etc.)
app.use(helmet());

// CORS — allow frontend dev server and same-origin requests
app.use(cors({
  origin: process.env['CORS_ORIGIN'] ?? 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type'],
}));

// Rate limiting — 100 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
});
app.use('/api/', limiter);

// Middleware
app.use(express.json());

// Request logging middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
  logger.info({ method: req.method, url: req.url }, 'incoming request');
  next();
});

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});

// Repositories — shared across bounded contexts for cascade operations
const clientRepository = new PrismaClientRepository();
const petRepository = new PrismaPetRepository();
const serviceRepository = new PrismaServiceRepository();

// Clients bounded context — wire dependencies
const clientController = new ClientController(
  new CreateClientUseCase(clientRepository),
  new GetClientUseCase(clientRepository),
  new ListClientsUseCase(clientRepository),
  new UpdateClientUseCase(clientRepository),
  new DeactivateClientUseCase(clientRepository, petRepository),
  new SoftDeleteClientUseCase(clientRepository, petRepository),
  new SearchClientsUseCase(clientRepository),
);
app.use('/api/v1/clients', createClientRouter(clientController));

// Pets bounded context — wire dependencies
const petController = new PetController(
  new CreatePetUseCase(petRepository),
  new GetPetUseCase(petRepository),
  new ListPetsUseCase(petRepository),
  new UpdatePetUseCase(petRepository),
  new DeactivatePetUseCase(petRepository),
  new SoftDeletePetUseCase(petRepository, serviceRepository),
  new SearchPetsUseCase(petRepository),
);
app.use('/api/v1/pets', createPetRouter(petController));

// Services bounded context — wire dependencies
const serviceController = new ServiceController(
  new CreateServiceUseCase(serviceRepository),
  new GetServiceUseCase(serviceRepository),
  new ListServicesUseCase(serviceRepository),
  new UpdateServiceUseCase(serviceRepository),
  new DeactivateServiceUseCase(serviceRepository),
  new SoftDeleteServiceUseCase(serviceRepository),
  new SearchServicesUseCase(serviceRepository),
);
app.use('/api/v1/services', createServiceRouter(serviceController));

// 404 handler — must be last route
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

// Global error handler — never leak internal details on 500
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error({ err }, 'Unhandled server error');
  res.status(500).json({ error: 'Internal server error' });
});

export { app };

// Start server only when not in test environment
if (process.env['NODE_ENV'] !== 'test') {
  const port = parseInt(process.env['PORT'] ?? '3000', 10);
  app.listen(port, () => {
    logger.info({ port }, `API server listening`);
  });
}
