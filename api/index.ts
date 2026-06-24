import 'dotenv/config';
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { logger } from './observability/logger';

// Validate required environment variables at startup
if (!process.env['DATABASE_URL']) {
  logger.error('DATABASE_URL environment variable is required but not set');
  process.exit(1);
}

const app = express();

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

// 404 handler — must be last route
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

export { app };

// Start server only when not in test environment
if (process.env['NODE_ENV'] !== 'test') {
  const port = parseInt(process.env['PORT'] ?? '3000', 10);
  app.listen(port, () => {
    logger.info({ port }, `API server listening`);
  });
}
