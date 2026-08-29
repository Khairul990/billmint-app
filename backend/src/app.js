import express from 'express';
import { config } from './config/env.js';
import { requestIdMiddleware } from './middleware/requestId.js';
import { createRateLimiter } from './middleware/rateLimit.js';
import { errorHandler } from './middleware/errorHandler.js';
import { healthRouter } from './modules/health/healthRoutes.js';
import { authRouter } from './modules/auth/authRoutes.js';
import { workspaceRouter } from './modules/workspaces/workspaceRoutes.js';
import { customerRouter } from './modules/customers/customerRoutes.js';
import { invoiceRouter } from './modules/invoices/invoiceRoutes.js';
import { publicInvoiceRouter } from './modules/public/publicInvoiceRoutes.js';

// Native Security Headers (Zero-dependency Helmet equivalent)
export const securityHeadersMiddleware = (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
};

// Native CORS Handler
export const corsMiddleware = (req, res, next) => {
  const origin = req.headers.origin;
  if (!origin || config.env === 'development' || config.cors.origin.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Request-ID, If-Match');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
};

export const createApp = () => {
  const app = express();

  // 1. Security Headers & CORS
  app.use(securityHeadersMiddleware);
  app.use(corsMiddleware);

  // 2. Request Parsing & Tracking
  app.use(express.json({ limit: '1mb' }));
  app.use(requestIdMiddleware);
  app.use(createRateLimiter({ windowMs: 60000, maxRequests: 300 }));

  // 3. Mount Routes
  app.use('/', healthRouter);
  app.use(`${config.apiPrefix}/auth`, authRouter);
  app.use(`${config.apiPrefix}/workspaces`, workspaceRouter);
  app.use(`${config.apiPrefix}/customers`, customerRouter);
  app.use(`${config.apiPrefix}/invoices`, invoiceRouter);
  app.use(`${config.apiPrefix}/public/invoices`, publicInvoiceRouter);

  // 4. 404 Not Found Handler (Express 5 compatible)
  app.use((req, res) => {
    res.status(404).json({
      error: {
        code: 'NOT_FOUND',
        message: `Endpoint ${req.method} ${req.originalUrl} does not exist.`,
        requestId: req.requestId
      }
    });
  });

  // 5. Global Standardized Error Handler
  app.use(errorHandler);

  return app;
};
