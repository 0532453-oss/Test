/**
 * Structured Logger for the FlexDesk Agent
 *
 * Supports log levels, timestamps, JSON output mode,
 * and a global configuration for debug mode.
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

const LOG_LEVEL_LABELS: Record<LogLevel, string> = {
  [LogLevel.DEBUG]: 'DEBUG',
  [LogLevel.INFO]: 'INFO',
  [LogLevel.WARN]: 'WARN',
  [LogLevel.ERROR]: 'ERROR',
};

interface LoggerOptions {
  level?: LogLevel;
  json?: boolean;
}

export class Logger {
  private static globalLevel: LogLevel = LogLevel.INFO;
  private static jsonMode = false;

  static configure(opts: LoggerOptions): void {
    if (opts.level !== undefined) Logger.globalLevel = opts.level;
    if (opts.json !== undefined) Logger.jsonMode = opts.json;
  }

  static getLevel(): LogLevel {
    return Logger.globalLevel;
  }

  constructor(private readonly context: string) {}

  debug(message: string, meta?: Record<string, unknown>): void {
    this.write(LogLevel.DEBUG, message, meta);
  }

  info(message: string, meta?: Record<string, unknown>): void {
    this.write(LogLevel.INFO, message, meta);
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    this.write(LogLevel.WARN, message, meta);
  }

  error(message: string, error?: Error | unknown, meta?: Record<string, unknown>): void {
    const errorMeta: Record<string, unknown> = { ...meta };
    if (error instanceof Error) {
      errorMeta.errorMessage = error.message;
      errorMeta.stack = error.stack;
    } else if (error !== undefined) {
      errorMeta.errorDetail = error;
    }
    this.write(LogLevel.ERROR, message, errorMeta);
  }

  private write(level: LogLevel, message: string, meta?: Record<string, unknown>): void {
    if (level < Logger.globalLevel) return;

    const timestamp = new Date().toISOString();
    const label = LOG_LEVEL_LABELS[level];

    if (Logger.jsonMode) {
      const entry: Record<string, unknown> = {
        timestamp,
        level: label,
        context: this.context,
        message,
      };
      if (meta && Object.keys(meta).length > 0) {
        entry.meta = meta;
      }
      // Use stderr for errors, stdout for everything else
      const output = JSON.stringify(entry);
      if (level >= LogLevel.ERROR) {
        console.error(output);
      } else {
        console.log(output);
      }
    } else {
      const prefix = `[${timestamp}] [${label}] [${this.context}]`;
      const hasMeta = meta && Object.keys(meta).length > 0;

      if (level >= LogLevel.ERROR) {
        console.error(hasMeta ? `${prefix} ${message}` : `${prefix} ${message}`, ...(hasMeta ? [meta] : []));
      } else if (level >= LogLevel.WARN) {
        console.warn(hasMeta ? `${prefix} ${message}` : `${prefix} ${message}`, ...(hasMeta ? [meta] : []));
      } else {
        console.log(hasMeta ? `${prefix} ${message}` : `${prefix} ${message}`, ...(hasMeta ? [meta] : []));
      }
    }
  }
}
