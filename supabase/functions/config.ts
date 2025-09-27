/// <reference path="./edge-types.d.ts" />

// Security configuration
export const SECURITY_CONFIG = {
  // Rate limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later'
  },

  // CORS
  cors: {
    // @ts-ignore: Deno namespace
    allowedOrigins: Deno.env.get('ALLOWED_ORIGINS')?.split(',') || ['*'],
    allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['authorization', 'x-client-info', 'apikey', 'content-type', 'x-csrf-token'],
    maxAge: 86400, // 24 hours
  },

  // Headers
  headers: {
    security: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Content-Security-Policy': [
        "default-src 'self'",
        "img-src 'self' data: https:",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
        "style-src 'self' 'unsafe-inline'",
        "connect-src 'self' https://api.stripe.com",
        "frame-src 'self' https://js.stripe.com",
      ].join('; '),
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
    }
  },

  // Authentication
  auth: {
    required: true, // Require authentication for all routes by default
    publicPaths: ['/auth/login', '/auth/register'], // Paths that don't require authentication
    tokenExpiration: '1h'
  },

  // Input validation
  validation: {
    // Maximum request body size (10MB)
    maxBodySize: 10 * 1024 * 1024,
    
    // Allowed file types for uploads
    allowedFileTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ],
    
    // Maximum file size for uploads (5MB)
    maxFileSize: 5 * 1024 * 1024
  },

  // CSRF Protection
  csrf: {
    enabled: true,
    cookieName: 'csrf-token',
    headerName: 'x-csrf-token'
  },

  // SQL Injection Protection
  sqlInjection: {
    // Characters to escape in SQL queries
    escapeChars: ["'", '"', '`', ';', '-', '/', '\\', '*'],
    
    // Maximum query length
    maxQueryLength: 1000
  },

  // Error messages
  errors: {
    unauthorized: 'Unauthorized access',
    forbidden: 'Access forbidden',
    rateLimitExceeded: 'Rate limit exceeded',
    invalidToken: 'Invalid or expired token',
    invalidInput: 'Invalid input data',
    serverError: 'Internal server error'
  }
};

// Validation schemas
export const VALIDATION_SCHEMAS = {
  booking: {
    required: ['space_id', 'start_time', 'end_time'],
    properties: {
      space_id: { type: 'string', minLength: 1 },
      start_time: { type: 'string', format: 'date-time' },
      end_time: { type: 'string', format: 'date-time' },
      status: { type: 'string', enum: ['pending', 'confirmed', 'cancelled'] }
    }
  },
  user: {
    required: ['email', 'password'],
    properties: {
      email: { type: 'string', format: 'email' },
      password: { type: 'string', minLength: 8 },
      full_name: { type: 'string', minLength: 2 },
      company_name: { type: 'string' }
    }
  },
  space: {
    required: ['name', 'capacity', 'pricing_type'],
    properties: {
      name: { type: 'string', minLength: 2 },
      description: { type: 'string' },
      capacity: { type: 'number', minimum: 1 },
      pricing_type: { type: 'string', enum: ['hourly', 'daily', 'monthly'] },
      image_url: { type: 'string', format: 'uri' }
    }
  }
};

// Environment configuration
export const ENV_CONFIG = {
  supabase: {
    // @ts-ignore: Deno namespace
    url: Deno.env.get('SUPABASE_URL') || '',
    // @ts-ignore: Deno namespace
    anonKey: Deno.env.get('SUPABASE_ANON_KEY') || '',
    // @ts-ignore: Deno namespace
    serviceRole: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
  },
  stripe: {
    // @ts-ignore: Deno namespace
    secretKey: Deno.env.get('STRIPE_SECRET_KEY') || '',
    // @ts-ignore: Deno namespace
    webhookSecret: Deno.env.get('STRIPE_WEBHOOK_SECRET') || '',
    currency: 'eur'
  },
  app: {
    // @ts-ignore: Deno namespace
    environment: Deno.env.get('ENVIRONMENT') || 'development',
    // @ts-ignore: Deno namespace
    debug: Deno.env.get('DEBUG') === 'true',
    // @ts-ignore: Deno namespace
    baseUrl: Deno.env.get('BASE_URL') || 'http://localhost:3000'
  }
};
