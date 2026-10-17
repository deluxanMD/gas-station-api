import type { NextFunction, Request, Response } from 'express';
import { logger } from '@/utils/logger';
import type { AppError } from '@/types';

export const errorMiddleware = (
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  const statusCode = err.statusCode ?? 500;
  const isProduction = process.env.NODE_ENV === 'production';
  const message = err.isOperational ? err.message : 'Internal Server Error';

  logger.error('Request error', {
    method: req.method,
    url: req.url,
    statusCode,
    message: err.message,
    ...(!isProduction && { stack: err.stack }),
  });

  res.status(statusCode).json({
    status: 'error',
    statusCode,
    message,
    timestamp: new Date().toISOString(),
    ...(!isProduction && { stack: err.stack }),
  });
};
