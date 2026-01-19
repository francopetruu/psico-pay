import { Router, Request, Response } from 'express';

export function createHealthRoutes(): Router {
  const router = Router();

  /**
   * Health check endpoint
   * GET /health
   */
  router.get('/', (req: Request, res: Response) => {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  return router;
}
