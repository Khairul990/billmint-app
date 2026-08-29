import { createApp } from './app.js';
import { config } from './config/env.js';
import { closePool } from './db/pool.js';

const app = createApp();

const server = app.listen(config.port, () => {
  console.log(`======================================================`);
  console.log(`🚀 BillQyro REST API v1 running on port ${config.port}`);
  console.log(`🌐 Environment: ${config.env}`);
  console.log(`🔗 Health Check: http://localhost:${config.port}/health`);
  console.log(`======================================================`);
});

// Graceful Shutdown Handlers
const handleShutdown = async (signal) => {
  console.log(`\n[SHUTDOWN] Received ${signal}. Starting graceful shutdown...`);
  server.close(async () => {
    console.log('[SHUTDOWN] HTTP server closed.');
    try {
      await closePool();
      console.log('[SHUTDOWN] PostgreSQL connection pool drained.');
      process.exit(0);
    } catch (err) {
      console.error('[SHUTDOWN ERROR]', err.message);
      process.exit(1);
    }
  });

  // Force close after 10s timeout
  setTimeout(() => {
    console.error('[SHUTDOWN TIMEOUT] Forcefully exiting.');
    process.exit(1);
  }, 10000).unref();
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));
