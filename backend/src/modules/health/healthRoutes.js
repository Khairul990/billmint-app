import { Router } from 'express';
import { healthCheck } from '../../db/pool.js';

export const healthRouter = Router();

healthRouter.get('/health', async (req, res) => {
  const isDbHealthy = await healthCheck();
  if (!isDbHealthy) {
    return res.status(503).json({
      status: 'error',
      service: 'billqyro-api',
      database: 'unavailable',
      requestId: req.requestId
    });
  }

  return res.status(200).json({
    status: 'ok',
    service: 'billqyro-api',
    database: 'ok',
    timestamp: new Date().toISOString()
  });
});

healthRouter.get('/ready', async (req, res) => {
  return res.status(200).json({
    ready: true,
    service: 'billqyro-api',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  });
});
