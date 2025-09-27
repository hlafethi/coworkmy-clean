// Jest setup file
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Mock global objects if needed
// For example, if you need to mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock Intersection Observer
class MockIntersectionObserver implements IntersectionObserver {
  readonly root: Element | Document | null = null;
  readonly rootMargin: string = '';
  readonly thresholds: ReadonlyArray<number> = [];
  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(callback: IntersectionObserverCallback) {
    // Callback is stored but not used in this mock implementation
  }
  
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
  takeRecords(): IntersectionObserverEntry[] { return []; }
}

global.IntersectionObserver = MockIntersectionObserver;

// Mock ResizeObserver
class MockResizeObserver {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(callback: ResizeObserverCallback) {
    // Callback is stored but not used in this mock implementation
  }
  
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

global.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;

// Mock fetch if needed
// global.fetch = jest.fn();

// Setup for Supabase mocking
jest.mock('@supabase/supabase-js', () => {
  const mockSupabaseClient = {
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      onAuthStateChange: jest.fn(),
    },
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
      match: jest.fn().mockReturnThis(),
      then: jest.fn().mockImplementation(callback => Promise.resolve(callback({ data: [], error: null }))),
    }),
    storage: {
      from: jest.fn().mockReturnValue({
        upload: jest.fn(),
        getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: 'https://example.com/image.jpg' } }),
      }),
    },
  };

  return {
    createClient: jest.fn().mockReturnValue(mockSupabaseClient),
  };
});

// Mock Stripe if needed
jest.mock('@stripe/stripe-js', () => ({
  loadStripe: jest.fn().mockResolvedValue({
    redirectToCheckout: jest.fn().mockResolvedValue({ error: null }),
  }),
}));

// Set timezone for consistent date testing
process.env.TZ = 'Europe/Paris';

// Suppression des avertissements de console pendant les tests
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  console.error = (...args: unknown[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };

  console.warn = (...args: unknown[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render is no longer supported') ||
        args[0].includes('Warning: React.createFactory()'))
    ) {
      return;
    }
    originalWarn.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});

// Nettoyage après chaque test
afterEach(() => {
  cleanup();
});
