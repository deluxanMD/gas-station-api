import app from './app';
import { env } from '@/config/env';
import { connectDatabase, disconnectDatabase } from '@/config/database';
import { logger } from '@/utils/logger';

const server = app.listen(env.PORT, () => {
  logger.info(`Server started`, {
    port: env.PORT,
    env: env.NODE_ENV,
    api: `/api/${env.API_VERSION}`,
  });
});

connectDatabase().catch((error: Error) => {
  logger.error('Database connection failed', { message: error.message });
  process.exit(1);
});

const shutdown = (signal: string): void => {
  logger.info(`${signal} received — shutting down gracefully`);
  server.close(() => {
    logger.info('Server closed');
    disconnectDatabase()
      .catch((error: Error) => logger.error('Database shutdown failed', { message: error.message }))
      .finally(() => process.exit(0));
  });

  // Force shutdown after 10 seconds if graceful close hangs
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10_000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught exception', { message: error.message, stack: error.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason: unknown) => {
  logger.error('Unhandled promise rejection', { reason });
  process.exit(1);
});

export default server;
