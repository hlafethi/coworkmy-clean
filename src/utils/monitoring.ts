import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';
import { onCLS, onFID, onLCP } from 'web-vitals';

// Define types for web vitals
type MetricName = 'CLS' | 'FID' | 'LCP' | 'FCP' | 'TTFB';
type MetricValue = {
  name: MetricName;
  value: number;
  id: string;
};

// Define Transaction interface
interface ITransaction {
  startChild(options: { op: string; description: string }): {
    finish(): void;
  };
  finish(): void;
}

/**
 * Initialize the monitoring system
 */
export function initMonitoring() {
  if (import.meta.env.DEV) {
    console.log('Monitoring initialized in', import.meta.env.MODE, 'mode');
  }
  
  if (import.meta.env.PROD) {
    // Initialisation Sentry uniquement si la DSN est définie
    const dsn = import.meta.env.VITE_SENTRY_DSN;
    if (dsn && dsn !== '' && dsn !== 'https://examplePublicKey@o0.ingest.sentry.io/0') {
      Sentry.init({
        dsn,
        integrations: [new BrowserTracing() as any],
        tracesSampleRate: 0.2,
        environment: import.meta.env.MODE,
        beforeSend(event: any) {
          return event;
        },
      });
      if (import.meta.env.DEV) {
        console.log('[Sentry] Initialisé avec DSN:', dsn);
      }
    } else {
      if (import.meta.env.DEV) {
        console.warn('[Sentry] Aucune DSN fournie, Sentry n\'est pas initialisé. Ajoutez VITE_SENTRY_DSN à votre .env.production');
      }
    }
    
    // Initialize web vitals
    try {
      // Use dynamic import to avoid TypeScript errors with web-vitals
      // The actual functions will be available at runtime
      import('web-vitals').then((webVitals: any) => {
        if (webVitals.getCLS) webVitals.getCLS(reportWebVital);
        if (webVitals.getFID) webVitals.getFID(reportWebVital);
        if (webVitals.getLCP) webVitals.getLCP(reportWebVital);
        if (webVitals.getFCP) webVitals.getFCP(reportWebVital);
        if (webVitals.getTTFB) webVitals.getTTFB(reportWebVital);
      });
    } catch (e) {
      console.error('Failed to load web-vitals', e);
    }
  }
  
  // Set up global error handler
  window.addEventListener('error', (event) => {
    logError(event.error || new Error(event.message), {
      source: event.filename,
      line: event.lineno,
      column: event.colno
    });
    
    // Don't prevent default to allow browser's default error handling
  });
  
  // Set up unhandled promise rejection handler
  window.addEventListener('unhandledrejection', (event) => {
    logError(event.reason || new Error('Unhandled Promise rejection'), {
      promise: 'Unhandled Promise rejection'
    });
  });
}

/**
 * Report Web Vitals to Sentry and analytics
 */
function reportWebVital(metric: MetricValue) {
  if (import.meta.env.DEV) {
    console.log(`[Web Vital] ${metric.name}: ${metric.value}`);
  }
  
  if (import.meta.env.PROD) {
    // Send to Sentry
    Sentry.captureMessage(`[Web Vital] ${metric.name}`, {
      level: 'info' as any,
      tags: {
        metric: metric.name,
        value: String(metric.value),
      },
    });
    
    // You could also send to analytics
    // if (window.gtag) {
    //   window.gtag('event', 'web_vitals', {
    //     metric_name: metric.name,
    //     metric_value: Math.round(metric.value * 1000) / 1000,
    //     metric_id: metric.id,
    //   });
    // }
  }
}

/**
 * Log an error to the console and monitoring service
 * @param error The error to log
 * @param context Additional context for the error
 */
export function logError(error: Error | unknown, context?: Record<string, unknown>) {
  const errorInfo = {
    message: error instanceof Error ? error.message : 'Unknown error',
    stack: error instanceof Error ? error.stack : undefined,
    context
  };
  if (import.meta.env.DEV) {
    console.error('Error:', errorInfo);
  }
  // In production, send to monitoring service
  if (import.meta.env.PROD) {
    Sentry.captureException(error, {
      extra: context,
    });
  }
}

/**
 * Log an event for analytics or monitoring
 * @param name The name of the event
 * @param data Additional data for the event
 */
export function logEvent(name: string, data?: Record<string, any>) {
  if (import.meta.env.DEV) {
    console.log('[EVENT]', name, data);
  }
  
  // In production, send to monitoring service
  if (import.meta.env.PROD) {
    Sentry.captureMessage(name, {
      level: 'info' as any,
      tags: data ? Object.entries(data).reduce((acc, [key, value]) => {
        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
          acc[key] = String(value);
        }
        return acc;
      }, {} as Record<string, string>) : undefined,
      extra: data,
    });
  }
}

/**
 * Start tracking performance for an operation
 * @param name The name of the operation
 * @returns A transaction object that should be finished when the operation completes
 */
export function startPerformanceTracking(name: string): ITransaction {
  // In production, use actual performance monitoring
  if (import.meta.env.PROD) {
    try {
      // Use any type to bypass TypeScript errors
      // The actual function will be available at runtime
      const transaction = (Sentry as any).startTransaction?.({ name, op: 'performance' });
      if (transaction) return transaction;
    } catch (e) {
      console.error('Failed to start Sentry transaction', e);
    }
  }
  
  // In development or if Sentry fails, use console timing
  console.time(`[PERFORMANCE] ${name}`);
  return {
    startChild: (options) => {
      console.time(`[PERFORMANCE] ${name} - ${options.description}`);
      return {
        finish: () => {
          console.timeEnd(`[PERFORMANCE] ${name} - ${options.description}`);
        }
      };
    },
    finish: () => {
      console.timeEnd(`[PERFORMANCE] ${name}`);
    }
  };
}

/**
 * Measure the performance of a function
 * @param name The name of the operation
 * @param fn The function to measure
 * @returns The result of the function
 */
export async function measurePerformance<T>(name: string, fn: () => Promise<T>): Promise<T> {
  const transaction = startPerformanceTracking(name);
  try {
    return await fn();
  } finally {
    transaction?.finish();
  }
}

export const reportWebVitals = async (onPerfEntry?: (metric: any) => void) => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    onCLS(onPerfEntry);
    onFID(onPerfEntry);
    onLCP(onPerfEntry);
  }
};
