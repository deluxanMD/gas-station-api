type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVEL_VALUES: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const isLogLevel = (value: string): value is LogLevel => value in LOG_LEVEL_VALUES;

const getCurrentLevelValue = (): number => {
  const raw = process.env.LOG_LEVEL ?? 'info';
  return isLogLevel(raw) ? (LOG_LEVEL_VALUES[raw] ?? 1) : 1;
};

const log = (level: LogLevel, message: string, meta?: unknown): void => {
  const levelValue = LOG_LEVEL_VALUES[level] ?? 1;
  if (levelValue < getCurrentLevelValue()) return;

  const entry = {
    timestamp: new Date().toISOString(),
    level: level.toUpperCase(),
    message,
    ...(meta !== undefined && { meta }),
  };

  const output = JSON.stringify(entry) + '\n';

  if (level === 'error') {
    process.stderr.write(output);
  } else {
    process.stdout.write(output);
  }
};

export const logger = {
  debug: (message: string, meta?: unknown): void => log('debug', message, meta),
  info: (message: string, meta?: unknown): void => log('info', message, meta),
  warn: (message: string, meta?: unknown): void => log('warn', message, meta),
  error: (message: string, meta?: unknown): void => log('error', message, meta),
};
