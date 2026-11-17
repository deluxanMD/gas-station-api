import { MAINTENANCE_INTERVAL_MS } from '@/constants/sync.constants';
import { purgeExpiredIdempotencyKeys } from '@/services/idempotency.service';
import { purgeExpiredRefreshTokens } from '@/services/refreshToken.service';
import { logger } from '@/utils/logger';

export const runMaintenance = async (): Promise<void> => {
  const [idempotencyKeys, refreshTokens] = await Promise.all([
    purgeExpiredIdempotencyKeys(),
    purgeExpiredRefreshTokens(),
  ]);
  if (idempotencyKeys > 0 || refreshTokens > 0) {
    logger.info('Purged expired rows', { idempotencyKeys, refreshTokens });
  }
};

/** Runs the purge now and then every hour; the returned function stops it. A failed run is logged and retried next time. */
export const startMaintenance = (): (() => void) => {
  const run = (): void => {
    runMaintenance().catch((error: unknown) => {
      logger.warn('Maintenance failed', {
        message: error instanceof Error ? error.message : String(error),
      });
    });
  };
  run();
  const timer = setInterval(run, MAINTENANCE_INTERVAL_MS);
  timer.unref();
  return () => clearInterval(timer);
};
