import { useEffect, useState } from 'react';
// Logger supprimé - utilisation de console directement
interface PerformanceMetrics {
  loadTime: number;
  domContentLoaded: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  timeToInteractive: number;
  memoryUsage?: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
}

const PerformanceMonitor = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Afficher le moniteur en mode développement
    if (import.meta.env.MODE === 'development') {
      setIsVisible(true);
    }

    const measurePerformance = () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paint = performance.getEntriesByType('paint');
      
      const metrics: PerformanceMetrics = {
        loadTime: navigation.loadEventEnd - navigation.loadEventStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
        largestContentfulPaint: 0,
        timeToInteractive: 0
      };

      // Mesurer LCP
      if ('PerformanceObserver' in window) {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          metrics.largestContentfulPaint = lastEntry.startTime;
        });
        observer.observe({ entryTypes: ['largest-contentful-paint'] });
      }

      // Mesurer TTI
      if ('PerformanceObserver' in window) {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          metrics.timeToInteractive = lastEntry.startTime;
        });
        observer.observe({ entryTypes: ['measure'] });
      }

      // Mesurer l'utilisation mémoire
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        metrics.memoryUsage = {
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit
        };
      }

      setMetrics(metrics);
      console.log('📊 Performance metrics:', metrics);
    };

    // Mesurer après le chargement complet
    if (document.readyState === 'complete') {
      measurePerformance();
    } else {
      window.addEventListener('load', measurePerformance);
    }

    return () => {
      window.removeEventListener('load', measurePerformance);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg text-xs z-50 max-w-sm">
      <h3 className="font-bold mb-2">Performance Monitor</h3>
      {metrics ? (
        <div className="space-y-1">
          <div>Load Time: {metrics.loadTime.toFixed(2)}ms</div>
          <div>DOM Ready: {metrics.domContentLoaded.toFixed(2)}ms</div>
          <div>FCP: {metrics.firstContentfulPaint.toFixed(2)}ms</div>
          <div>LCP: {metrics.largestContentfulPaint.toFixed(2)}ms</div>
          <div>TTI: {metrics.timeToInteractive.toFixed(2)}ms</div>
          {metrics.memoryUsage && (
            <div>
              Memory: {(metrics.memoryUsage.usedJSHeapSize / 1024 / 1024).toFixed(1)}MB
            </div>
          )}
        </div>
      ) : (
        <div>Measuring performance...</div>
      )}
      <button
        onClick={() => setIsVisible(false)}
        className="absolute top-1 right-1 text-white/60 hover:text-white"
      >
        ×
      </button>
    </div>
  );
};

export default PerformanceMonitor; 