import type { Request, Response } from 'express';
import { env } from '@/config/env';

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

export const getReadiness = (_req: Request, res: Response): void => {
  res.status(200).json({ status: 'ready' });
};

export const getLiveness = (_req: Request, res: Response): void => {
  res.status(200).json({ status: 'alive' });
};
