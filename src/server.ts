import { app } from './app.js';
import { env } from './config/environment.js';
import { logger } from './utils/logger.js';
import { Server } from 'http';

let server: Server;

const startServer = (): void => {
  server = app.listen(env.PORT, () => {
    logger.info(`🚀 Server running in [${env.NODE_ENV}] mode on port ${env.PORT}`);
  });
};

const gracefulShutdown = (signal: string): void => {
  logger.warn(`Received ${signal}. Starting graceful shutdown...`);

  if (server) {
    server.close(() => {
      logger.info('HTTP server closed.');
      process.exit(0);
    });

    // Enforce shutdown after 10 seconds if connections hang
    setTimeout(() => {
      logger.error('Forceful shutdown executed: connections did not close in time.');
      process.exit(1);
    }, 10000);
  } else {
    process.exit(0);
  }
};

process.on('uncaughtException', (error: Error) => {
  logger.error('CRITICAL: Uncaught Exception detected!', {
    message: error.message,
    stack: error.stack,
  });
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason: unknown) => {
  logger.error('CRITICAL: Unhandled Promise Rejection detected!', {
    reason: reason instanceof Error ? reason.message : reason,
    stack: reason instanceof Error ? reason.stack : undefined,
  });
  gracefulShutdown('unhandledRejection');
});

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

startServer();
