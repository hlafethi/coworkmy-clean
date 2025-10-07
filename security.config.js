module.exports = {
  // Content Security Policy
  csp: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://js.stripe.com"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "https://api.stripe.com", process.env.SUPABASE_URL],
      frameSrc: ["'self'", "https://js.stripe.com"],
      fontSrc: ["'self'", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      childSrc: ["'self'", "blob:"],
      workerSrc: ["'self'", "blob:"],
      frameAncestors: ["'none'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: true
    }
  },

  // CORS Configuration
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-CSRF-Token',
      'X-Requested-With',
      'Accept',
      'Accept-Version',
      'Content-Length',
      'Content-MD5',
      'Date',
      'X-Api-Version'
    ],
    credentials: true,
    maxAge: 86400 // 24 hours
  },

  // Rate Limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 2000, // limit each IP to 2000 requests per windowMs
    message: 'Too many requests from this IP, please try again later',
    headers: true,
    skipFailedRequests: false,
    skipSuccessfulRequests: false,
    keyGenerator: (req) => req.ip,
    handler: (req, res) => {
      res.status(429).json({
        error: 'Too many requests, please try again later.'
      });
    }
  },

  // Session Configuration
  session: {
    name: 'sessionId',
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24, // 24 hours
      sameSite: 'strict'
    }
  },

  // Password Policy
  passwordPolicy: {
    minLength: 12,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    maxAge: 90 * 24 * 60 * 60 * 1000, // 90 days
    preventReuse: 5 // prevent reuse of last 5 passwords
  },

  // File Upload Security
  fileUpload: {
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB
      files: 5 // max number of files
    },
    allowedTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ],
    scanForVirus: true,
    preserveExtension: true,
    sanitizeFilename: true
  },

  // Security Headers
  headers: {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), camera=(), microphone=()'
  },

  // CSRF Protection
  csrf: {
    enabled: true,
    cookie: {
      key: 'csrf-token',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/'
    },
    ignoreMethods: ['GET', 'HEAD', 'OPTIONS'],
    value: (req) => req.headers['x-csrf-token']
  },

  // Authentication
  auth: {
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: '1h',
    refreshTokenExpiresIn: '7d',
    maxDevices: 5,
    lockoutAttempts: 5,
    lockoutTime: 15 * 60 * 1000, // 15 minutes
    requireEmailVerification: true,
    passwordResetTimeLimit: 1 * 60 * 60 * 1000 // 1 hour
  },

  // Logging and Monitoring
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: 'json',
    sensitiveFields: [
      'password',
      'token',
      'secret',
      'credit_card',
      'authorization'
    ],
    excludePaths: [
      '/health',
      '/metrics',
      '/favicon.ico'
    ]
  },

  // Database Security
  database: {
    maxConnections: 20,
    ssl: process.env.NODE_ENV === 'production',
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 10000,
    statementTimeout: 30000,
    queryTimeout: 30000
  },

  // API Security
  api: {
    timeout: 30000,
    maxBodySize: '10mb',
    validateInput: true,
    sanitizeOutput: true,
    requireAuthentication: true,
    rateLimitByEndpoint: {
      '/api/auth/login': {
        windowMs: 15 * 60 * 1000,
        max: 5
      },
      '/api/auth/register': {
        windowMs: 60 * 60 * 1000,
        max: 3
      }
    }
  }
};
