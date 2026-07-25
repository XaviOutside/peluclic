import 'dotenv/config';
import { initSentry } from './observability/sentry';
initSentry();

import { setupExpressErrorHandler } from '@sentry/node';
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { logger } from './observability/logger';
import { sanitizeUrl } from './shared/utils/piiSanitizer';
import { PrismaClientRepository } from './clients/infrastructure/PrismaClientRepository';
import { CreateClientUseCase } from './clients/application/CreateClient';
import { GetClientUseCase } from './clients/application/GetClient';
import { ListClientsUseCase } from './clients/application/ListClients';
import { UpdateClientUseCase } from './clients/application/UpdateClient';
import { DeactivateClientUseCase } from './clients/application/DeactivateClient';
import { ReactivateClientUseCase } from './clients/application/ReactivateClient';
import { SoftDeleteClientUseCase } from './clients/application/SoftDeleteClient';
import { SearchClientsUseCase } from './clients/application/SearchClients';
import { ExportClientUseCase } from './clients/application/ExportClient';
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
import { PrismaAppointmentRepository } from './appointments/infrastructure/PrismaAppointmentRepository';
import { CreateAppointmentUseCase } from './appointments/application/CreateAppointment';
import { GetAppointmentUseCase } from './appointments/application/GetAppointment';
import { ListAppointmentsUseCase } from './appointments/application/ListAppointments';
import { UpdateAppointmentUseCase } from './appointments/application/UpdateAppointment';
import { CancelAppointmentUseCase } from './appointments/application/CancelAppointment';
import { AppointmentController } from './appointments/interface/AppointmentController';
import { createAppointmentRouter } from './appointments/interface/appointmentRouter';
import { PrismaSettingsRepository } from './settings/infrastructure/PrismaSettingsRepository';
import { GetSettingsUseCase } from './settings/application/GetSettings';
import { UpdateSettingsUseCase } from './settings/application/UpdateSettings';
import { SettingsController } from './settings/interface/SettingsController';
import { createSettingsRouter } from './settings/interface/settingsRouter';
import { PrismaAuthRepository } from './auth/infrastructure/PrismaAuthRepository';
import { Argon2PasswordService } from './auth/infrastructure/Argon2PasswordService';
import { LoginUseCase } from './auth/application/LoginUseCase';
import { LogoutUseCase } from './auth/application/LogoutUseCase';
import { AuthController } from './auth/interface/AuthController';
import { createAuthRouter } from './auth/interface/authRouter';
import { createAuthMiddleware } from './auth/interface/authMiddleware';

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
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting — 100 reqs/15min per IP in production; relaxed in dev
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 100 : 10_000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
});
app.use('/api/', limiter);

// Middleware
app.use(express.json());

// Request logging middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
  logger.info({ method: req.method, url: sanitizeUrl(req.url) }, 'incoming request');
  next();
});

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});

// ── Auth bounded context — wire dependencies ──────────────────────

// Auth-specific rate limiter: 5 req/15min per IP on login (brute-force protection)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 5 : 10_000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts, please try again later' },
});

const authRepository = new PrismaAuthRepository();
const passwordService = new Argon2PasswordService();
const sessionDurationHours = parseInt(
  process.env['SESSION_DURATION_HOURS'] ?? '24',
  10,
);

const authController = new AuthController(
  new LoginUseCase(authRepository, passwordService, sessionDurationHours),
  new LogoutUseCase(authRepository),
);

// Mount auth routes BEFORE the auth middleware so login/logout are public
// Rate limit only applies to the auth router (login + logout)
app.use('/api/v1/auth', authLimiter, createAuthRouter(authController));

// Apply auth middleware AFTER auth routes but BEFORE all business routes.
// All /api/v1/* routes below this line require a valid session token.
app.use('/api/v1', createAuthMiddleware(authRepository));

// Repositories — shared across bounded contexts for cascade operations
const clientRepository = new PrismaClientRepository();
const petRepository = new PrismaPetRepository();
const serviceRepository = new PrismaServiceRepository();
const appointmentRepository = new PrismaAppointmentRepository();

// Clients bounded context — wire dependencies
const clientController = new ClientController(
  new CreateClientUseCase(clientRepository),
  new GetClientUseCase(clientRepository),
  new ListClientsUseCase(clientRepository),
  new UpdateClientUseCase(clientRepository),
  new DeactivateClientUseCase(clientRepository, petRepository),
  new ReactivateClientUseCase(clientRepository),
  new SoftDeleteClientUseCase(clientRepository, petRepository),
  new SearchClientsUseCase(clientRepository),
  new ExportClientUseCase(clientRepository, petRepository, appointmentRepository, serviceRepository),
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

// Appointments bounded context — wire dependencies
const appointmentController = new AppointmentController(
  new CreateAppointmentUseCase(appointmentRepository, petRepository),
  new GetAppointmentUseCase(appointmentRepository),
  new ListAppointmentsUseCase(appointmentRepository),
  new UpdateAppointmentUseCase(appointmentRepository),
  new CancelAppointmentUseCase(appointmentRepository),
);
app.use('/api/v1/appointments', createAppointmentRouter(appointmentController));

// Settings bounded context — wire dependencies
const settingsRepository = new PrismaSettingsRepository();
const settingsController = new SettingsController(
  new GetSettingsUseCase(settingsRepository),
  new UpdateSettingsUseCase(settingsRepository),
);
app.use('/api/v1/settings', createSettingsRouter(settingsController));

// 404 handler — must be last route
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

// Sentry error handler — must be before the generic error handler
setupExpressErrorHandler(app);

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
