import { logger } from '@/utils/logger';
/**
 * Analytics utilities for tracking user behavior and application usage
 */

// Define the Google Analytics interface
interface GoogleAnalytics {
  (command: 'send', hitType: 'event', eventCategory: string, eventAction: string, eventLabel?: string, eventValue?: number): void;
  (command: 'send', hitType: 'pageview', page: string): void;
  (command: 'set', name: string, value: any): void;
  (command: 'config', trackingId: string, params?: any): void;
  (command: 'event', eventName: string, eventParams?: any): void;
}

// Define the window interface with gtag
declare global {
  interface Window {
    gtag?: GoogleAnalytics;
    dataLayer?: any[];
  }
}

/**
 * Initialize analytics
 */
export function initAnalytics() {
  if (import.meta.env.PROD) {
    // Only initialize in production
    const ANALYTICS_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;
    
    if (!ANALYTICS_ID) {
      logger.warn('Analytics ID not provided. Analytics will not be initialized.');
      return;
    }
    
    // Create script tag for Google Analytics
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${ANALYTICS_ID}`;
    document.head.appendChild(script);
    
    // Initialize the data layer
    window.dataLayer = window.dataLayer || [];
    window.gtag = function() {
      window.dataLayer?.push(arguments);
    };
    
    // Configure Google Analytics
    window.gtag = function() {
      window.dataLayer?.push(arguments);
    };
    
    // Add gtag initialization
    (window as any).gtag('js', new Date());
    (window as any).gtag('config', ANALYTICS_ID, {
      send_page_view: false, // We'll track page views manually
      anonymize_ip: true,
      cookie_flags: 'SameSite=None;Secure',
    });
    
    logger.debug('Analytics initialized');
  }
}

/**
 * Track a page view
 * @param path The path of the page
 * @param title The title of the page
 */
export function trackPageView(path: string, title?: string) {
  if (!import.meta.env.PROD || !window.gtag) return;
  
  window.gtag('send', 'pageview', path);
  
  if (title) {
    window.gtag('set', 'page_title', title);
  }
  
  if (import.meta.env.DEV) {
    logger.debug(`[Analytics] Page view: ${path}`);
  }
}

/**
 * Track an event
 * @param category The event category
 * @param action The event action
 * @param label Optional event label
 * @param value Optional event value
 */
export function trackEvent(category: string, action: string, label?: string, value?: number) {
  if (!import.meta.env.PROD || !window.gtag) return;
  
  window.gtag('send', 'event', category, action, label, value);
  
  if (import.meta.env.DEV) {
    logger.debug(`[Analytics] Event: ${category} / ${action}${label ? ` / ${label}` : ''}${value !== undefined ? ` / ${value}` : ''}`);
  }
}

/**
 * Track a conversion
 * @param conversionId The conversion ID
 * @param label The conversion label
 */
export function trackConversion(conversionId: string, label: string) {
  if (!import.meta.env.PROD || !window.gtag) return;
  
  window.gtag('event', 'conversion', {
    send_to: `${conversionId}/${label}`,
    value: 1.0,
    currency: 'EUR',
  });
  
  logger.debug(`[Analytics] Conversion: ${conversionId} / ${label}`);
}

/**
 * Track user timing
 * @param category The timing category
 * @param variable The timing variable
 * @param value The timing value in milliseconds
 * @param label Optional timing label
 */
export function trackTiming(category: string, variable: string, value: number, label?: string) {
  if (!import.meta.env.PROD || !window.gtag) return;
  
  window.gtag('event', 'timing_complete', {
    name: variable,
    value: value,
    event_category: category,
    event_label: label,
  });
  
  if (import.meta.env.DEV) {
    logger.debug(`[Analytics] Timing: ${category} / ${variable} / ${value}ms${label ? ` / ${label}` : ''}`);
  }
}

/**
 * Set user properties
 * @param properties The user properties to set
 */
export function setUserProperties(properties: Record<string, any>) {
  if (!import.meta.env.PROD || !window.gtag) return;
  
  window.gtag('set', 'user_properties', properties);
  
  if (import.meta.env.DEV) {
    logger.debug(`[Analytics] User properties set: ${Object.keys(properties).join(', ')}`);
  }
}

/**
 * Track an exception
 * @param description The exception description
 * @param fatal Whether the exception was fatal
 */
export function trackException(description: string, fatal: boolean = false) {
  if (!import.meta.env.PROD || !window.gtag) return;
  
  window.gtag('event', 'exception', {
    description: description,
    fatal: fatal,
  });
  
  if (import.meta.env.DEV) {
    logger.debug(`[Analytics] Exception: ${description} (fatal: ${fatal})`);
  }
}
