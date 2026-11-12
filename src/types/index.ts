export interface ApiResponse<T = unknown> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export type { RegisterInput } from './auth.types';
export type { CreditTotals } from './creditTotals.types';
export type { DailySummaryReport } from './dailySummaryReport.types';
export type { Shift } from './shift.types';
export type { HealthStatus } from './health.types';
export type { LogLevel } from './logger.types';
