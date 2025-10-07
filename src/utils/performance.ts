import { logger } from './logger';

// Cache pour les données fréquemment utilisées
const cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

// Configuration des performances
const PERFORMANCE_CONFIG = {
  CACHE_TTL: 5 * 60 * 1000, // 5 minutes
  DEBOUNCE_DELAY: 300,
  THROTTLE_DELAY: 1000,
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
};

// Debounce function
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number = PERFORMANCE_CONFIG.DEBOUNCE_DELAY
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

// Throttle function
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  delay: number = PERFORMANCE_CONFIG.THROTTLE_DELAY
): ((...args: Parameters<T>) => void) => {
  let lastCall = 0;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
};

// Cache function
export const withCache = <T extends (...args: any[]) => Promise<any>>(
  func: T,
  keyGenerator: (...args: Parameters<T>) => string,
  ttl: number = PERFORMANCE_CONFIG.CACHE_TTL
): T => {
  return (async (...args: Parameters<T>) => {
    const key = keyGenerator(...args);
    const cached = cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      console.log(`📦 Cache hit for key: ${key}`);
      return cached.data;
    }
    
    console.log(`🔄 Cache miss for key: ${key}`);
    const data = await func(...args);
    
    cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
    
    return data;
  }) as T;
};

// Retry function
export const withRetry = <T extends (...args: any[]) => Promise<any>>(
  func: T,
  maxRetries: number = PERFORMANCE_CONFIG.MAX_RETRIES,
  delay: number = PERFORMANCE_CONFIG.RETRY_DELAY
): T => {
  return (async (...args: Parameters<T>) => {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await func(...args);
      } catch (error) {
        lastError = error as Error;
        console.warn(`🔄 Attempt ${attempt}/${maxRetries} failed:`, error);
        
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, delay * attempt));
        }
      }
    }
    
    throw lastError!;
  }) as T;
};

// Performance monitoring
export const measurePerformance = <T extends (...args: any[]) => any>(
  func: T,
  name: string
): T => {
  return (async (...args: Parameters<T>) => {
    const start = performance.now();
    try {
      const result = await func(...args);
      const duration = performance.now() - start;
      console.log(`⏱️ ${name} took ${duration.toFixed(2)}ms`);
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      console.error(`❌ ${name} failed after ${duration.toFixed(2)}ms:`, error);
      throw error;
    }
  }) as T;
};

// Memory monitoring
export const logMemoryUsage = () => {
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    const used = (memory.usedJSHeapSize / 1024 / 1024).toFixed(1);
    const total = (memory.totalJSHeapSize / 1024 / 1024).toFixed(1);
    const limit = (memory.jsHeapSizeLimit / 1024 / 1024).toFixed(1);
    
    console.log(`🧠 Memory: ${used}MB / ${total}MB (limit: ${limit}MB)`);
  }
};

// Clear cache
export const clearCache = (pattern?: string) => {
  if (pattern) {
    for (const key of cache.keys()) {
      if (key.includes(pattern)) {
        cache.delete(key);
      }
    }
    console.log(`🗑️ Cleared cache for pattern: ${pattern}`);
  } else {
    cache.clear();
    console.log('🗑️ Cleared all cache');
  }
};

// Preload critical resources
export const preloadResources = () => {
  const criticalResources = [
    '/assets/vendor-h_RLe6kY.js',
    '/assets/index-DPoTuu-O.css',
    '/icons/icon-192x192.png'
  ];
  
  criticalResources.forEach(resource => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = resource;
    link.as = resource.endsWith('.js') ? 'script' : resource.endsWith('.css') ? 'style' : 'image';
    document.head.appendChild(link);
  });
  
  console.log('🚀 Preloaded critical resources');
};

// Lazy load images
export const lazyLoadImages = () => {
  const images = document.querySelectorAll('img[data-src]');
  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement;
        img.src = img.dataset.src!;
        img.removeAttribute('data-src');
        imageObserver.unobserve(img);
      }
    });
  });
  
  images.forEach(img => imageObserver.observe(img));
  console.log('🖼️ Lazy loading images initialized');
}; 