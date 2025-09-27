/// <reference path="./edge-types.d.ts" />

// @ts-ignore: Deno module resolution
import { createClient } from "@supabase/supabase-js";
// @ts-ignore: Deno module resolution
import { RateLimiter } from "rate_limiter";

// Rate limiting configuration
const limiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

// CORS configuration
const corsHeaders = {
  // @ts-ignore: Deno namespace
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGINS') || '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Max-Age': '86400',
};

// XSS Protection Headers
const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Content-Security-Policy': "default-src 'self'; img-src 'self' data: https:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';",
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
};

// Data validation schemas
const schemas = {
  booking: {
    required: ['space_id', 'start_time', 'end_time'],
    properties: {
      space_id: { type: 'string', minLength: 1 },
      start_time: { type: 'string', format: 'date-time' },
      end_time: { type: 'string', format: 'date-time' },
      status: { type: 'string', enum: ['pending', 'confirmed', 'cancelled'] }
    }
  }
};

// Validate request data against schema
function validateData(data: any, schema: any) {
  const required = schema.required || [];
  const properties = schema.properties || {};

  // Check required fields
  for (const field of required) {
    if (!data[field]) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  // Validate field types and formats
  for (const [field, value] of Object.entries(data)) {
    const fieldSchema = properties[field];
    if (!fieldSchema) continue;

    // Type validation
    if (fieldSchema.type === 'string' && typeof value !== 'string') {
      throw new Error(`Invalid type for ${field}: expected string`);
    }

    // Format validation
    if (fieldSchema.format === 'date-time') {
      const date = new Date(value as string);
      if (isNaN(date.getTime())) {
        throw new Error(`Invalid date format for ${field}`);
      }
    }

    // Enum validation
    if (fieldSchema.enum && !fieldSchema.enum.includes(value)) {
      throw new Error(`Invalid value for ${field}: must be one of ${fieldSchema.enum.join(', ')}`);
    }
  }
}

// Middleware function
export async function middleware(req: EdgeRequest, schema?: keyof typeof schemas) {
  try {
    // Rate limiting
    const clientIp = req.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitResult = await limiter.try_acquire(clientIp);
    if (!rateLimitResult.success) {
      return new Response('Too many requests', {
        status: 429,
        headers: { ...corsHeaders, ...securityHeaders }
      });
    }

    // CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders });
    }

    // Data validation
    if (schema && req.method !== 'GET') {
      const data = await req.json();
      try {
        validateData(data, schemas[schema]);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Invalid data format';
        return new Response(JSON.stringify({ error: errorMessage }), {
          status: 400,
          headers: { ...corsHeaders, ...securityHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // CSRF Protection
    const csrfToken = req.headers.get('x-csrf-token');
    if (req.method !== 'GET' && !csrfToken) {
      return new Response('CSRF token missing', {
        status: 403,
        headers: { ...corsHeaders, ...securityHeaders }
      });
    }

    // Authentication check
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response('Unauthorized', {
        status: 401,
        headers: { ...corsHeaders, ...securityHeaders }
      });
    }

    return null; // Continue to handler
  } catch (error: unknown) {
    console.error("Middleware error:", error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, ...securityHeaders, 'Content-Type': 'application/json' }
    });
  }
}
