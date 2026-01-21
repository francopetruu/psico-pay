import express, { Express, Request, Response, NextFunction } from 'express';
import { logger } from './lib/logger.js';
import {
  createWebhookRoutes,
  createHealthRoutes,
  createPaymentRoutes,
} from './routes/index.js';
import { PaymentService, NotificationService } from './services/index.js';
import { type Repositories } from './repositories/index.js';

export interface ServerConfig {
  port: number;
}

export interface ServerDependencies {
  paymentService: PaymentService;
  notificationService: NotificationService;
  repositories: Repositories;
}

export function createServer(
  dependencies: ServerDependencies,
  _config: ServerConfig
): Express {
  const app = express();

  // Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Request logging
  app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      logger.debug(
        {
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          durationMs: duration,
        },
        'Request completed'
      );
    });
    next();
  });

  // Routes
  app.use('/health', createHealthRoutes());
  app.use('/payment', createPaymentRoutes());
  app.use(
    '/webhook',
    createWebhookRoutes(
      dependencies.paymentService,
      dependencies.notificationService,
      dependencies.repositories
    )
  );

  // 404 handler
  app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: 'Not found' });
  });

  // Error handler
  app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
    logger.error(
      {
        error: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
      },
      'Unhandled error'
    );

    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}

export function startServer(
  app: Express,
  config: ServerConfig
): Promise<void> {
  return new Promise((resolve) => {
    app.listen(config.port, () => {
      logger.info({ port: config.port }, 'Server started');
      resolve();
    });
  });
}
