import type { Request, Response } from 'express';
import { env } from '@/config/env';
import { isDatabaseReady } from '@/config/database';

interface HealthStatus {
  status: 'ok' | 'degraded' | 'error';
  timestamp: string;
  version: string;
  environment: string;
  uptime: number;
}

export const getHealth = (_req: Request, res: Response): void => {
  const health: HealthStatus = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env['npm_package_version'] ?? '1.0.0',
    environment: env.NODE_ENV,
    uptime: process.uptime(),
  };

  res.status(200).json(health);
};

export const getReadiness = async (_req: Request, res: Response): Promise<void> => {
  const database = await isDatabaseReady();
  res.status(database ? 200 : 503).json({ status: database ? 'ready' : 'not_ready', database });
};

export const getLiveness = (_req: Request, res: Response): void => {
  res.status(200).json({ status: 'alive' });
};
