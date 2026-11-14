import type { AppError } from '@/types';

export const httpError = (statusCode: number, message: string): AppError =>
  Object.assign(new Error(message), { statusCode, isOperational: true });
