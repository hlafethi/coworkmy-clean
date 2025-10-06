// Version simplifiée du serveur pour éviter les problèmes path-to-regexp
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { Pool } from 'pg';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import Stripe from 'stripe';

const app = express();

// Configuration de base
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Requested-With']
}));

app.use(express.json({ limit: '10mb' }));

// Servir les fichiers statiques du frontend
app.use(express.static('dist'));

// Configuration PostgreSQL
const pool = new Pool({
  host: process.env.DB_HOST || '147.93.58.155',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'coworkmy',
  user: process.env.DB_USER || 'vpshostinger',
  password: process.env.DB_PASSWORD || 'Fethi@2025!',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

// Configuration JWT
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
if (JWT_SECRET === 'your-secret-key') {
  console.warn('⚠️  ATTENTION: Changez cette clé en production !');
}

// Middleware d'authentification
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token d\'accès requis' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token invalide' });
    }
    req.user = user;
    next();
  });
};

// Fonction utilitaire pour les réponses
const sendResponse = (res, success, data = null, error = null) => {
  res.json({ success, data, error });
};

// Routes API
app.get('/api/health', (req, res) => {
  sendResponse(res, true, {
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

app.get('/api/spaces', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM spaces ORDER BY created_at DESC');
    sendResponse(res, true, result.rows);
  } catch (error) {
    console.error('Erreur récupération espaces:', error);
    sendResponse(res, false, null, 'Erreur serveur');
  }
});

// Route pour SPA - toutes les routes non-API redirigent vers index.html
app.get('/*', (req, res) => {
  // Si c'est une route API, retourner 404
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ 
      success: false,
      error: "Endpoint non trouvé",
      path: req.originalUrl 
    });
  }
  
  // Pour toutes les autres routes, servir index.html (SPA)
  res.sendFile('index.html', { root: 'dist' });
});

// Démarrage du serveur
const PORT = process.env.API_PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 API CoworkMy démarrée sur le port ${PORT}`);
  console.log(`📁 Frontend servi depuis: dist/`);
  console.log(`🌐 Endpoints disponibles:`);
  console.log(`   - GET  /api/health`);
  console.log(`   - GET  /api/spaces`);
});

export default app;
