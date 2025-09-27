// This needs to be a module to use global augmentation
export {};

// Type definitions for http/server module
declare module 'http/server' {
  /**
   * Serves HTTP requests with the given handler.
   */
  export function serve(
    handler: (request: Request) => Response | Promise<Response>,
    options?: {
      port?: number;
      hostname?: string;
      signal?: AbortSignal;
      onListen?: (params: { hostname: string; port: number }) => void;
    }
  ): void;
}

// Global augmentation for Deno
declare global {
  namespace Deno {
    interface Env {
      get(key: string): string | undefined;
      set(key: string, value: string): void;
      delete(key: string): void;
      toObject(): { [key: string]: string };
    }
    
    const env: Env;
  }
}
