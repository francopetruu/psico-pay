import { Router, Request, Response } from 'express';
import { logger } from '../lib/logger.js';

export function createPaymentRoutes(): Router {
  const router = Router();

  /**
   * Payment success redirect
   * GET /payment/success
   */
  router.get('/success', (req: Request, res: Response) => {
    logger.info(
      { query: req.query },
      'Payment success redirect'
    );

    res.send(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Pago Confirmado</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
          }
          .container {
            text-align: center;
            padding: 2rem;
            max-width: 400px;
          }
          .icon { font-size: 4rem; margin-bottom: 1rem; }
          h1 { margin: 0 0 1rem; }
          p { opacity: 0.9; line-height: 1.6; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon">✅</div>
          <h1>¡Pago Confirmado!</h1>
          <p>Gracias por tu pago. Recibirás el link de videollamada por WhatsApp 15 minutos antes de tu sesión.</p>
          <p>Puedes cerrar esta página.</p>
        </div>
      </body>
      </html>
    `);
  });

  /**
   * Payment failure redirect
   * GET /payment/failure
   */
  router.get('/failure', (req: Request, res: Response) => {
    logger.warn(
      { query: req.query },
      'Payment failure redirect'
    );

    res.send(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Pago No Completado</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            color: white;
          }
          .container {
            text-align: center;
            padding: 2rem;
            max-width: 400px;
          }
          .icon { font-size: 4rem; margin-bottom: 1rem; }
          h1 { margin: 0 0 1rem; }
          p { opacity: 0.9; line-height: 1.6; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon">❌</div>
          <h1>Pago No Completado</h1>
          <p>El pago no pudo ser procesado. Por favor, intenta nuevamente usando el link que recibiste por WhatsApp.</p>
          <p>Si el problema persiste, contacta a tu terapeuta.</p>
        </div>
      </body>
      </html>
    `);
  });

  /**
   * Payment pending redirect
   * GET /payment/pending
   */
  router.get('/pending', (req: Request, res: Response) => {
    logger.info(
      { query: req.query },
      'Payment pending redirect'
    );

    res.send(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Pago Pendiente</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #f6d365 0%, #fda085 100%);
            color: white;
          }
          .container {
            text-align: center;
            padding: 2rem;
            max-width: 400px;
          }
          .icon { font-size: 4rem; margin-bottom: 1rem; }
          h1 { margin: 0 0 1rem; }
          p { opacity: 0.9; line-height: 1.6; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon">⏳</div>
          <h1>Pago Pendiente</h1>
          <p>Tu pago está siendo procesado. Recibirás una confirmación por WhatsApp cuando se complete.</p>
          <p>Puedes cerrar esta página.</p>
        </div>
      </body>
      </html>
    `);
  });

  return router;
}
