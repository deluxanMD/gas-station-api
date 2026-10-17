import type { Request, Response } from 'express';

export const notFoundMiddleware = (req: Request, res: Response): void => {
  res.status(404).json({
    status: 'error',
    statusCode: 404,
    message: `Route ${req.method} ${req.url} not found`,
    timestamp: new Date().toISOString(),
  });
};
