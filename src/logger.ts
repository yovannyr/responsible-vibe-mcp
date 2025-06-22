/**
 * Logging utility for Vibe Feature MCP Server
 * 
 * Provides structured logging with proper levels:
 * - debug: Tracing and detailed execution flow
 * - info: Success operations and important milestones
 * - warn: Expected errors and recoverable issues
 * - error: Caught but unexpected errors
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

export interface LogContext {
  component?: string;
  conversationId?: string;
  phase?: string;
  operation?: string;
  [key: string]: any;
}

class Logger {
  private logLevel: LogLevel;
  private component: string;

  constructor(component: string, logLevel: LogLevel = LogLevel.INFO) {
    this.component = component;
    this.logLevel = this.getLogLevelFromEnv() ?? logLevel;
  }

  private getLogLevelFromEnv(): LogLevel | null {
    const envLevel = process.env.LOG_LEVEL?.toUpperCase();
    switch (envLevel) {
      case 'DEBUG': return LogLevel.DEBUG;
      case 'INFO': return LogLevel.INFO;
      case 'WARN': return LogLevel.WARN;
      case 'ERROR': return LogLevel.ERROR;
      default: return null;
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.logLevel;
  }

  private formatMessage(level: string, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    return `[${timestamp}] ${level.toUpperCase()} [${this.component}] ${message}${contextStr}`;
  }

  debug(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.debug(this.formatMessage('debug', message, context));
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.info(this.formatMessage('info', message, context));
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatMessage('warn', message, context));
    }
  }

  error(message: string, error?: Error, context?: LogContext): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      const errorContext = error ? { ...context, error: error.message, stack: error.stack } : context;
      console.error(this.formatMessage('error', message, errorContext));
    }
  }

  child(childComponent: string): Logger {
    return new Logger(`${this.component}:${childComponent}`, this.logLevel);
  }
}

// Factory function to create loggers
export function createLogger(component: string, logLevel?: LogLevel): Logger {
  return new Logger(component, logLevel);
}

// Default logger for the main application
export const logger = createLogger('VibeFeatureMCP');
