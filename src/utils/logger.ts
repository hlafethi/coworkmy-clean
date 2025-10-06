// Logger utilitaire pour contrôler les logs en production
const isDevelopment = import.meta.env.DEV;
const isProduction = import.meta.env.PROD;

// Configuration des logs par niveau
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
} as const;

type LogLevel = keyof typeof LOG_LEVELS;

// Niveau de log actuel (en production, on garde seulement ERROR et WARN)
const CURRENT_LOG_LEVEL = isProduction ? LOG_LEVELS.WARN : LOG_LEVELS.DEBUG;

class Logger {
  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] <= CURRENT_LOG_LEVEL;
  }

  error(...args: any[]): void {
    if (this.shouldLog('ERROR')) {
      console.error(...args);
    }
  }

  warn(...args: any[]): void {
    if (this.shouldLog('WARN')) {
      console.warn(...args);
    }
  }

  info(...args: any[]): void {
    if (this.shouldLog('INFO')) {
      console.log(...args);
    }
  }

  debug(...args: any[]): void {
    if (this.shouldLog('DEBUG')) {
      console.log(...args);
    }
  }

  // Méthode pour les logs de développement uniquement
  dev(...args: any[]): void {
    if (isDevelopment) {
      console.log(...args);
    }
  }
}

export const logger = new Logger();

// Export des méthodes pour un usage direct
export const log = {
  error: logger.error.bind(logger),
  warn: logger.warn.bind(logger),
  info: logger.info.bind(logger),
  debug: logger.debug.bind(logger),
  dev: logger.dev.bind(logger)
};