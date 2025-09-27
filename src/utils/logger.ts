/**
 * Utilitaire de logging qui désactive les logs en production
 */

const isDevelopment = import.meta.env.DEV;
const isProduction = import.meta.env.PROD;

class Logger {
  private shouldLog(): boolean {
    return isDevelopment || import.meta.env.VITE_ENABLE_LOGS === 'true';
  }

  log(...args: any[]): void {
    if (this.shouldLog()) {
      console.log(...args);
    }
  }

  warn(...args: any[]): void {
    if (this.shouldLog()) {
      console.warn(...args);
    }
  }

  error(...args: any[]): void {
    // Les erreurs sont toujours loggées, même en production
    console.error(...args);
  }

  info(...args: any[]): void {
    if (this.shouldLog()) {
      console.info(...args);
    }
  }

  debug(...args: any[]): void {
    if (this.shouldLog()) {
      console.debug(...args);
    }
  }
}

export const logger = new Logger();

// Fonction utilitaire pour remplacer console.log
export const log = (...args: any[]) => logger.log(...args);
export const warn = (...args: any[]) => logger.warn(...args);
export const error = (...args: any[]) => logger.error(...args);
export const info = (...args: any[]) => logger.info(...args);
export const debug = (...args: any[]) => logger.debug(...args);
