// Types for Edge Functions

// Deno namespace declaration
declare namespace Deno {
  export interface Env {
    get(key: string): string | undefined;
    set(key: string, value: string): void;
    toObject(): Record<string, string>;
  }

  export const env: Env;
}

// Rate limiter module
declare module "rate_limiter" {
  interface RateLimiterOptions {
    windowMs: number;
    max: number;
  }

  interface RateLimiterResult {
    success: boolean;
    remaining: number;
    reset: number;
  }

  export class RateLimiter {
    constructor(options: RateLimiterOptions);
    try_acquire(key: string): Promise<RateLimiterResult>;
  }
}

// Extend existing types
declare global {
  // Request type for Edge Functions
  type EdgeRequest = Request;

  // Database configuration
  interface DbConfig {
    type: "mysql" | "postgresql";
    host: string;
    port: string;
    database: string;
    username: string;
    password: string;
  }

  // Admin settings
  interface AdminSettings {
    id: string;
    site_name: string | null;
    contact_email: string | null;
    phone_number: string | null;
    hero_title: string | null;
    hero_subtitle: string | null;
    cta_text: string | null;
    features_title: string | null;
    features_subtitle: string | null;
    stripe_publishable_key?: string | null;
    stripe_secret_key?: string | null;
    workspace_title?: string | null;
    created_at: string;
    updated_at: string;
  }
}

export {};
