import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Configuration de la base de données
const pool = new Pool({
  user: process.env.VITE_DATABASE_USER || process.env.DB_USER || 'vpshostinger',
  host: process.env.VITE_DATABASE_HOST || process.env.DB_HOST || '147.93.58.155',
  database: process.env.VITE_DATABASE_NAME || process.env.DB_NAME || 'coworkmy',
  password: process.env.VITE_DATABASE_PASSWORD || process.env.DB_PASSWORD || 'Fethi@2025!',
  port: process.env.VITE_DATABASE_PORT || process.env.DB_PORT || 5432,
  ssl: process.env.VITE_DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Augmenter la limite pour les images
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Initialisation de la base de données
async function initializeDatabase() {
  try {
    console.log('🔧 Initialisation de la base de données...');
    
    // Vérifier la structure de la table profiles
    const tableInfo = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'profiles'
    `);
    
    console.log('📋 Structure actuelle de la table profiles:', tableInfo.rows);
    
    // Ajouter les colonnes manquantes si elles n'existent pas
    const columns = tableInfo.rows.map(row => row.column_name);
    
    if (!columns.includes('password_hash')) {
      console.log('➕ Ajout de la colonne password_hash...');
      await pool.query('ALTER TABLE profiles ADD COLUMN password_hash VARCHAR(255)');
    }
    
    if (!columns.includes('full_name')) {
      console.log('➕ Ajout de la colonne full_name...');
      await pool.query('ALTER TABLE profiles ADD COLUMN full_name VARCHAR(255)');
    }
    
    if (!columns.includes('is_admin')) {
      console.log('➕ Ajout de la colonne is_admin...');
      await pool.query('ALTER TABLE profiles ADD COLUMN is_admin BOOLEAN DEFAULT FALSE');
    }

    // Création de la table support_tickets si elle n'existe pas
    await pool.query(`
      CREATE TABLE IF NOT EXISTS support_tickets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES profiles(id),
        subject VARCHAR(500) NOT NULL,
        message TEXT NOT NULL,
        priority VARCHAR(20) DEFAULT 'medium',
        status VARCHAR(20) DEFAULT 'open',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Création de la table support_ticket_responses si elle n'existe pas
    await pool.query(`
      CREATE TABLE IF NOT EXISTS support_ticket_responses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ticket_id UUID REFERENCES support_tickets(id),
        user_id UUID REFERENCES profiles(id),
        message TEXT NOT NULL,
        is_admin BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    console.log('✅ Base de données initialisée avec succès');
  } catch (error) {
    console.error('❌ Erreur initialisation base de données:', error);
  }
}

// Initialiser la base de données au démarrage
initializeDatabase();

// Middleware d'authentification
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, error: 'Token d\'accès requis' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, error: 'Token invalide' });
    }
    req.user = user;
    next();
  });
};

// Route de test
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'API CoworkMy fonctionne' });
});

// Endpoint de test simple sans base de données
app.get('/api/test-simple', (req, res) => {
  res.json({ status: 'OK', message: 'Test simple réussi', timestamp: new Date().toISOString() });
});

// Endpoints d'authentification
app.get('/api/auth/me', (req, res) => {
  res.json({ 
    success: true, 
    user: null,
    message: 'Aucun utilisateur connecté' 
  });
});

// Endpoint de connexion
app.post('/api/auth/signin', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('🔐 Tentative de connexion pour:', email);
    
    if (!email || !password) {
      console.log('❌ Email ou mot de passe manquant');
      return res.status(400).json({ 
        success: false, 
        error: 'Email et mot de passe requis' 
      });
    }

    // Recherche de l'utilisateur dans la base de données
    console.log('🔍 Recherche de l\'utilisateur dans la base de données...');
    const userResult = await pool.query(
      'SELECT id, email, password_hash, full_name, is_admin FROM profiles WHERE email = $1',
      [email]
    );

    console.log('📊 Nombre d\'utilisateurs trouvés:', userResult.rows.length);

    if (userResult.rows.length === 0) {
      console.log('❌ Aucun utilisateur trouvé avec cet email');
      return res.status(401).json({ 
        success: false, 
        error: 'Email ou mot de passe incorrect' 
      });
    }

    const user = userResult.rows[0];
    console.log('👤 Utilisateur trouvé:', user.email, 'Admin:', user.is_admin);

    // Vérification du mot de passe
    console.log('🔒 Vérification du mot de passe...');
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!isValidPassword) {
      console.log('❌ Mot de passe incorrect');
      return res.status(401).json({ 
        success: false, 
        error: 'Email ou mot de passe incorrect' 
      });
    }

    console.log('✅ Mot de passe correct');

    // Génération du token JWT
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        isAdmin: user.is_admin 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    console.log('🎫 Token JWT généré pour:', user.email);

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          is_admin: user.is_admin
        },
        token
      },
      message: 'Connexion réussie'
    });

  } catch (error) {
    console.error('❌ Erreur connexion:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur interne du serveur' 
    });
  }
});

// Endpoint d'inscription
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password, full_name } = req.body;
    
    if (!email || !password || !full_name) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email, mot de passe et nom requis' 
      });
    }

    // Vérification si l'utilisateur existe déjà
    const existingUser = await pool.query(
      'SELECT id FROM profiles WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ 
        success: false, 
        error: 'Un utilisateur avec cet email existe déjà' 
      });
    }

    // Hashage du mot de passe
    const passwordHash = await bcrypt.hash(password, 10);

    // Création de l'utilisateur
    const newUser = await pool.query(
      'INSERT INTO profiles (id, email, password_hash, full_name, is_admin, created_at) VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING id, email, full_name, is_admin',
      [crypto.randomUUID(), email, passwordHash, full_name, false]
    );

    const user = newUser.rows[0];

    // Génération du token JWT
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        isAdmin: user.is_admin 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          is_admin: user.is_admin
        },
        token
      },
      message: 'Inscription réussie'
    });

  } catch (error) {
    console.error('Erreur inscription:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur interne du serveur' 
    });
  }
});

// Endpoints pour les espaces
app.get('/api/spaces', async (req, res) => {
  try {
    console.log('🏢 GET /api/spaces - Récupération des espaces...');
    
    // Vérifier que la table spaces existe
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'spaces'
      );
    `);
    
    if (!tableExists.rows[0].exists) {
      console.log('📋 Table spaces n\'existe pas encore');
      res.json({ 
        success: true, 
        data: [],
        message: 'Aucun espace disponible' 
      });
      return;
    }
    
    // Récupérer tous les espaces (actifs et inactifs)
    const result = await pool.query(`
      SELECT * FROM spaces 
      ORDER BY created_at DESC
    `);
    
    console.log(`✅ ${result.rows.length} espaces trouvés`);
    res.json({ 
      success: true, 
      data: result.rows,
      message: result.rows.length > 0 ? `${result.rows.length} espaces disponibles` : 'Aucun espace disponible'
    });
  } catch (error) {
    console.error('❌ Erreur récupération espaces:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint supprimé - remplacé par l'endpoint dynamique plus bas

// Endpoint supprimé - remplacé par l'endpoint dynamique plus bas

// Endpoint de test de base de données
app.get('/api/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() as current_time');
    res.json({ status: 'OK', db_time: result.rows[0].current_time });
  } catch (error) {
    console.error('❌ Erreur test DB:', error);
    res.status(500).json({ status: 'ERROR', error: error.message });
  }
});

// Endpoint de test simple sans base de données
app.get('/api/test-simple', (req, res) => {
  res.json({ status: 'OK', message: 'Test simple réussi', timestamp: new Date().toISOString() });
});

// ===== ENDPOINTS DE TICKETS DE SUPPORT =====

// Récupérer les tickets de l'utilisateur
app.get('/api/support/tickets', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 GET /api/support/tickets - Récupération des tickets...');
    console.log('👤 User ID:', req.user.id);
    
    const result = await pool.query(
      `SELECT * FROM support_tickets
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [req.user.id]
    );
    
    console.log(`✅ ${result.rows.length} tickets trouvés`);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('❌ Erreur récupération tickets:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

// Créer un ticket
app.post('/api/support/tickets', authenticateToken, async (req, res) => {
  try {
    const { subject, message, priority = 'medium' } = req.body;
    console.log('🔍 POST /api/support/tickets - Création d\'un ticket...');
    console.log('👤 User ID:', req.user.id);
    console.log('📊 Données:', { subject, message, priority });
    
    // Vérifier si la table existe, sinon la créer
    try {
      await pool.query('SELECT 1 FROM support_tickets LIMIT 1');
    } catch (tableError) {
      if (tableError.code === '42P01') {
        console.log('📝 Création de la table support_tickets...');
        await pool.query(`
          CREATE TABLE IF NOT EXISTS support_tickets (
            id VARCHAR(36) PRIMARY KEY,
            user_id VARCHAR(36) NOT NULL,
            subject VARCHAR(255) NOT NULL,
            message TEXT NOT NULL,
            priority VARCHAR(20) DEFAULT 'medium',
            status VARCHAR(20) DEFAULT 'open',
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          )
        `);
        console.log('✅ Table support_tickets créée');
      } else {
        throw tableError;
      }
    }
    
    // Générer un UUID côté application
    const ticketId = crypto.randomUUID();
    
    const result = await pool.query(
      `INSERT INTO support_tickets (id, user_id, subject, message, priority, status, created_at)
       VALUES ($1, $2, $3, $4, $5, 'open', NOW())
       RETURNING *`,
      [ticketId, req.user.id, subject, message, priority]
    );
    
    console.log(`✅ Ticket créé:`, result.rows[0]);
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('❌ Erreur création ticket:', error);
    console.error('❌ Détails erreur:', error.message);
    console.error('❌ Stack trace:', error.stack);
    res.status(500).json({ success: false, error: 'Erreur serveur interne' });
  }
});

// Récupérer les réponses d'un ticket
app.get('/api/support/tickets/:id/responses', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🔍 GET /api/support/tickets/${id}/responses - Récupération des réponses...`);
    console.log('👤 User ID:', req.user.id);
    
    const result = await pool.query(
      `SELECT * FROM support_ticket_responses 
       WHERE ticket_id = $1 
       ORDER BY created_at ASC`,
      [id]
    );
    
    console.log(`✅ ${result.rows.length} réponses trouvées pour le ticket ${id}`);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('❌ Erreur récupération réponses ticket:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

// Ajouter une réponse à un ticket
app.post('/api/support/tickets/:id/responses', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { message, is_admin_response } = req.body;
    console.log(`🔍 POST /api/support/tickets/${id}/responses - Ajout d'une réponse...`);
    console.log('👤 User ID:', req.user.id);
    console.log('📊 Données:', { message, is_admin_response });
    
    const result = await pool.query(
      `INSERT INTO support_ticket_responses (ticket_id, user_id, message, is_admin_response, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING *`,
      [id, req.user.id, message, is_admin_response || false]
    );
    
    console.log(`✅ Réponse ajoutée au ticket ${id}:`, result.rows[0]);
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('❌ Erreur ajout réponse ticket:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

// ===== ENDPOINTS ADMIN DE TICKETS =====

// Récupérer tous les tickets (admin)
app.get('/api/admin/support/tickets', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 GET /api/admin/support/tickets - Récupération des tickets admin...');
    console.log('👤 User ID:', req.user.id);
    
    // Vérifier si l'utilisateur est admin
    const userCheck = await pool.query(
      'SELECT is_admin FROM profiles WHERE id = $1',
      [req.user.id]
    );
    
    if (!userCheck.rows[0]?.is_admin) {
      return res.status(403).json({ success: false, error: 'Accès refusé - Admin requis' });
    }
    
    const result = await pool.query(
      `SELECT st.*, p.full_name as user_name, p.email as user_email
       FROM support_tickets st
       JOIN profiles p ON st.user_id = p.id
       ORDER BY st.created_at DESC`
    );
    
    console.log(`✅ ${result.rows.length} tickets admin trouvés`);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('❌ Erreur récupération tickets admin:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

// Récupérer les réponses d'un ticket (admin)
app.get('/api/admin/support/tickets/:id/responses', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🔍 Récupération des réponses pour ticket:', id);
    
    const result = await pool.query(
      'SELECT * FROM support_ticket_responses WHERE ticket_id = $1 ORDER BY created_at ASC',
      [id]
    );
    
    console.log('✅ Réponses récupérées:', result.rows.length);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('❌ Erreur récupération réponses:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

// Ajouter une réponse admin à un ticket
app.post('/api/admin/support/tickets/:id/responses', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    console.log('🔍 Ajout réponse pour ticket:', id);
    
    const responseId = crypto.randomUUID();
    const result = await pool.query(
      'INSERT INTO support_ticket_responses (id, ticket_id, user_id, message, is_admin, created_at) VALUES ($1, $2, $3, $4, true, NOW()) RETURNING *',
      [responseId, id, req.user.id, message]
    );
    
    console.log('✅ Réponse admin ajoutée:', result.rows[0]);
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('❌ Erreur ajout réponse admin:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

// Mettre à jour le statut d'un ticket
app.put('/api/admin/support/tickets/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    console.log('🔍 Mise à jour statut ticket:', id, '->', status);
    
    const result = await pool.query(
      'UPDATE support_tickets SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [status, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Ticket non trouvé' });
    }
    
    console.log('✅ Statut ticket mis à jour:', result.rows[0]);
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('❌ Erreur mise à jour statut:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

// ===== ENDPOINTS TEMPORAIRES SANS AUTHENTIFICATION =====

// Créer un ticket utilisateur (sans auth)
app.post('/api/support/tickets-user-no-auth', async (req, res) => {
  try {
    const { subject, message, priority = 'medium' } = req.body;
    console.log('🔍 Création ticket utilisateur (sans auth)...');
    console.log('📊 Données:', { subject, message, priority });
    
    // Vérifier si la table existe, sinon la créer
    try {
      await pool.query('SELECT 1 FROM support_tickets LIMIT 1');
    } catch (tableError) {
      if (tableError.code === '42P01') {
        console.log('📝 Création de la table support_tickets...');
        await pool.query(`
          CREATE TABLE IF NOT EXISTS support_tickets (
            id VARCHAR(36) PRIMARY KEY,
            user_id VARCHAR(36) NOT NULL,
            subject VARCHAR(255) NOT NULL,
            message TEXT NOT NULL,
            priority VARCHAR(20) DEFAULT 'medium',
            status VARCHAR(20) DEFAULT 'open',
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          )
        `);
        console.log('✅ Table support_tickets créée');
      } else {
        throw tableError;
      }
    }
    
    // Générer UUID côté application
    const ticketId = crypto.randomUUID();
    const userId = 'f6682b18-7d10-4016-be08-885e989cffca'; // ID utilisateur fixe pour le test
    
    console.log('📝 UUID généré:', ticketId);
    console.log('👤 User ID utilisé:', userId);
    
    const result = await pool.query(
      `INSERT INTO support_tickets (id, user_id, subject, message, priority, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, 'open', NOW(), NOW())
       RETURNING *`,
      [ticketId, userId, subject, message, priority]
    );
    
    console.log('✅ Ticket utilisateur créé:', result.rows[0]);
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('❌ Erreur création ticket utilisateur:', error);
    console.error('❌ Détails erreur:', error.message);
    console.error('❌ Stack trace:', error.stack);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Récupérer les tickets admin (sans auth)
app.get('/api/admin/support/tickets-no-auth', async (req, res) => {
  try {
    console.log('🔍 Récupération des tickets admin (sans auth)...');
    
    const result = await pool.query(
      `SELECT st.*, p.full_name as user_name, p.email as user_email
       FROM support_tickets st
       JOIN profiles p ON st.user_id = p.id
       ORDER BY st.created_at DESC`
    );
    
    console.log(`✅ ${result.rows.length} tickets admin trouvés`);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('❌ Erreur récupération tickets admin:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

// Récupérer les réponses d'un ticket utilisateur (sans auth)
app.get('/api/support/tickets/:id/responses-user-no-auth', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🔍 Récupération des réponses pour ticket utilisateur (sans auth):', id);
    
    const result = await pool.query(
      `SELECT * FROM support_ticket_responses 
       WHERE ticket_id = $1 
       ORDER BY created_at ASC`,
      [id]
    );
    
    console.log('✅ Réponses utilisateur récupérées:', result.rows.length);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('❌ Erreur récupération réponses utilisateur:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

// Récupérer les réponses d'un ticket admin (sans auth)
app.get('/api/admin/support/tickets/:id/responses-no-auth', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🔍 Récupération des réponses pour ticket (sans auth):', id);
    
    const result = await pool.query(
      `SELECT * FROM support_ticket_responses 
       WHERE ticket_id = $1 
       ORDER BY created_at ASC`,
      [id]
    );
    
    console.log('✅ Réponses récupérées:', result.rows.length);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('❌ Erreur récupération réponses:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

// Ajouter une réponse utilisateur (sans auth)
app.post('/api/support/tickets/:id/responses-user-no-auth', async (req, res) => {
  try {
    console.log('🔍 Ajout réponse utilisateur sans auth...');
    console.log('📝 Données reçues:', req.body);
    
    const { id } = req.params;
    const { message } = req.body;
    const userId = 'f6682b18-7d10-4016-be08-885e989cffca'; // ID utilisateur fixe pour le test
    
    console.log('📝 Données extraites:', { ticketId: id, message, userId });
    
    // Vérifier si la table existe
    try {
      await pool.query('SELECT 1 FROM support_ticket_responses LIMIT 1');
      console.log('✅ Table support_ticket_responses existe');
      
      // Vérifier si la colonne is_admin existe, sinon l'ajouter
      try {
        await pool.query('SELECT is_admin FROM support_ticket_responses LIMIT 1');
        console.log('✅ Colonne is_admin existe');
      } catch (columnError) {
        if (columnError.code === '42703') {
          console.log('📝 Ajout de la colonne is_admin...');
          await pool.query('ALTER TABLE support_ticket_responses ADD COLUMN is_admin BOOLEAN DEFAULT FALSE');
          console.log('✅ Colonne is_admin ajoutée');
        } else {
          throw columnError;
        }
      }
    } catch (tableError) {
      if (tableError.code === '42P01') {
        console.log('📝 Création de la table support_ticket_responses...');
        await pool.query(`
          CREATE TABLE IF NOT EXISTS support_ticket_responses (
            id VARCHAR(36) PRIMARY KEY,
            ticket_id VARCHAR(36) NOT NULL,
            user_id VARCHAR(36) NOT NULL,
            message TEXT NOT NULL,
            is_admin BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT NOW()
          )
        `);
        console.log('✅ Table support_ticket_responses créée');
      } else {
        throw tableError;
      }
    }
    
    // Générer UUID côté application
    const responseId = crypto.randomUUID();
    console.log('📝 UUID généré:', responseId);
    
    const result = await pool.query(
      `INSERT INTO support_ticket_responses (id, ticket_id, user_id, message, is_admin, created_at)
       VALUES ($1, $2, $3, $4, FALSE, NOW())
       RETURNING *`,
      [responseId, id, userId, message]
    );
    
    console.log('✅ Réponse utilisateur ajoutée:', result.rows[0]);
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('❌ Erreur ajout réponse utilisateur:', error);
    console.error('❌ Détails erreur:', error.message);
    console.error('❌ Stack trace:', error.stack);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Ajouter une réponse admin (sans auth)
app.post('/api/admin/support/tickets/:id/responses-no-auth', async (req, res) => {
  try {
    console.log('🔍 Ajout réponse admin sans auth...');
    console.log('📝 Données reçues:', req.body);
    
    const { id } = req.params;
    const { message } = req.body;
    const adminUserId = 'f6682b18-7d10-4016-be08-885e989cffca'; // ID utilisateur fixe pour le test (admin temporaire)
    
    console.log('📝 Données extraites:', { ticketId: id, message, adminUserId });
    
    // Vérifier si la table existe
    try {
      await pool.query('SELECT 1 FROM support_ticket_responses LIMIT 1');
      console.log('✅ Table support_ticket_responses existe');
      
      // Vérifier si la colonne is_admin existe, sinon l'ajouter
      try {
        await pool.query('SELECT is_admin FROM support_ticket_responses LIMIT 1');
        console.log('✅ Colonne is_admin existe');
      } catch (columnError) {
        if (columnError.code === '42703') {
          console.log('📝 Ajout de la colonne is_admin...');
          await pool.query('ALTER TABLE support_ticket_responses ADD COLUMN is_admin BOOLEAN DEFAULT FALSE');
          console.log('✅ Colonne is_admin ajoutée');
        } else {
          throw columnError;
        }
      }
    } catch (tableError) {
      if (tableError.code === '42P01') {
        console.log('📝 Création de la table support_ticket_responses...');
        await pool.query(`
          CREATE TABLE IF NOT EXISTS support_ticket_responses (
            id VARCHAR(36) PRIMARY KEY,
            ticket_id VARCHAR(36) NOT NULL,
            user_id VARCHAR(36) NOT NULL,
            message TEXT NOT NULL,
            is_admin BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT NOW()
          )
        `);
        console.log('✅ Table support_ticket_responses créée');
      } else {
        throw tableError;
      }
    }
    
    // Générer UUID côté application
    const responseId = crypto.randomUUID();
    console.log('📝 UUID généré:', responseId);
    
    const result = await pool.query(
      `INSERT INTO support_ticket_responses (id, ticket_id, user_id, message, is_admin, created_at)
       VALUES ($1, $2, $3, $4, TRUE, NOW())
       RETURNING *`,
      [responseId, id, adminUserId, message]
    );
    
    console.log('✅ Réponse admin ajoutée:', result.rows[0]);
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('❌ Erreur ajout réponse admin:', error);
    console.error('❌ Détails erreur:', error.message);
    console.error('❌ Stack trace:', error.stack);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint pour récupérer les utilisateurs (admin)
app.get('/api/users', async (req, res) => {
  try {
    console.log('👥 Récupération des utilisateurs...');
    
    const result = await pool.query(`
      SELECT 
        id, 
        email, 
        full_name, 
        first_name, 
        last_name,
        is_admin, 
        created_at,
        updated_at
      FROM profiles 
      ORDER BY created_at DESC
    `);
    
    console.log('✅ Utilisateurs récupérés:', result.rows.length);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('❌ Erreur récupération utilisateurs:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint pour récupérer les réservations (admin)
app.get('/api/admin/bookings', async (req, res) => {
  try {
    console.log('📅 Récupération des réservations admin...');
    
    // D'abord, vérifier la structure de la table bookings
    const structureResult = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'bookings' 
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Structure de la table bookings:', structureResult.rows);
    
    // Requête adaptée selon la structure réelle
    const result = await pool.query(`
      SELECT 
        b.*,
        p.email as user_email,
        p.full_name as user_name,
        s.name as space_name,
        s.description as space_description
      FROM bookings b
      LEFT JOIN profiles p ON b.user_id = p.id
      LEFT JOIN spaces s ON b.space_id = s.id
      ORDER BY b.created_at DESC
    `);
    
    console.log('✅ Réservations récupérées:', result.rows.length);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('❌ Erreur récupération réservations:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint pour récupérer les paiements (admin)
app.get('/api/payments', async (req, res) => {
  try {
    console.log('💳 Récupération des paiements admin...');
    
    // Vérifier la structure de la table payments
    const structureResult = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'payments' 
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Structure de la table payments:', structureResult.rows);
    
    // Requête adaptée selon la structure réelle
    const result = await pool.query(`
      SELECT 
        p.*,
        pr.email as user_email,
        pr.full_name as user_name,
        s.name as space_name,
        b.start_date,
        b.end_date
      FROM payments p
      LEFT JOIN bookings b ON p.booking_id = b.id
      LEFT JOIN profiles pr ON b.user_id = pr.id
      LEFT JOIN spaces s ON b.space_id = s.id
      ORDER BY p.created_at DESC
    `);
    
    console.log('✅ Paiements récupérés:', result.rows.length);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('❌ Erreur récupération paiements:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint pour récupérer les paramètres admin
app.get('/api/admin/settings', async (req, res) => {
  try {
    console.log('⚙️ Récupération des paramètres admin...');
    
    // Vérifier la structure de la table admin_settings
    const structureResult = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'admin_settings' 
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Structure de la table admin_settings:', structureResult.rows);
    
    // Récupérer les paramètres
    const result = await pool.query(`
      SELECT * FROM admin_settings ORDER BY created_at DESC
    `);
    
    console.log('✅ Paramètres récupérés:', result.rows.length);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('❌ Erreur récupération paramètres:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint pour récupérer les créneaux horaires
app.get('/api/time-slots', async (req, res) => {
  try {
    console.log('⏰ Récupération des créneaux horaires...');
    
    const result = await pool.query(`
      SELECT * FROM time_slots ORDER BY day_of_week, start_time
    `);
    
    console.log('✅ Créneaux récupérés:', result.rows.length);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('❌ Erreur récupération créneaux:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint pour récupérer les modèles d'email
app.get('/api/email-templates', async (req, res) => {
  try {
    console.log('📧 Récupération des modèles d\'email...');
    
    const result = await pool.query(`
      SELECT * FROM email_templates ORDER BY created_at DESC
    `);
    
    console.log('✅ Modèles récupérés:', result.rows.length);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('❌ Erreur récupération modèles:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint pour récupérer les pages légales
app.get('/api/legal-pages', async (req, res) => {
  try {
    console.log('📄 Récupération des pages légales...');
    
    // Vérifier si la table existe
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'legal_pages'
      );
    `);
    
    if (!tableExists.rows[0].exists) {
      console.log('📄 Table legal_pages n\'existe pas, retour de données par défaut');
      res.json({ success: true, data: [] });
      return;
    }
    
    const result = await pool.query(`
      SELECT * FROM legal_pages ORDER BY created_at DESC
    `);
    
    console.log('✅ Pages récupérées:', result.rows.length);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('❌ Erreur récupération pages:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint pour récupérer les paramètres de cookies
app.get('/api/cookie-settings', async (req, res) => {
  try {
    console.log('🍪 Récupération des paramètres cookies...');
    
    const result = await pool.query(`
      SELECT * FROM cookie_settings ORDER BY created_at DESC
    `);
    
    console.log('✅ Paramètres cookies récupérés:', result.rows.length);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('❌ Erreur récupération cookies:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint pour créer des pages légales
app.post('/api/legal-pages', async (req, res) => {
  try {
    console.log('📄 Création de pages légales...');
    
    // Vérifier si la table existe
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'legal_pages'
      );
    `);
    
    if (!tableExists.rows[0].exists) {
      console.log('📄 Table legal_pages n\'existe pas, retour de données par défaut');
      const pages = Array.isArray(req.body) ? req.body : [req.body];
      res.json({ success: true, data: pages });
      return;
    }
    
    const pages = Array.isArray(req.body) ? req.body : [req.body];
    
    const result = await pool.query(`
      INSERT INTO legal_pages (type, title, content, last_updated)
      VALUES ${pages.map((_, index) => `($${index * 4 + 1}, $${index * 4 + 2}, $${index * 4 + 3}, $${index * 4 + 4})`).join(', ')}
      RETURNING *
    `, pages.flatMap(page => [page.type, page.title, page.content, page.last_updated]));
    
    console.log('✅ Pages légales créées:', result.rows.length);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('❌ Erreur création pages légales:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint pour mettre à jour une page légale
app.put('/api/legal-pages/:type', async (req, res) => {
  try {
    console.log('📄 Mise à jour de la page légale:', req.params.type);
    
    // Vérifier si la table existe
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'legal_pages'
      );
    `);
    
    if (!tableExists.rows[0].exists) {
      console.log('📄 Table legal_pages n\'existe pas, retour de données par défaut');
      const { title, content, last_updated } = req.body;
      res.json({ success: true, data: { type: req.params.type, title, content, last_updated } });
      return;
    }
    
    const { title, content, last_updated } = req.body;
    
    const result = await pool.query(`
      UPDATE legal_pages 
      SET title = $1, content = $2, last_updated = $3
      WHERE type = $4
      RETURNING *
    `, [title, content, last_updated, req.params.type]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Page non trouvée' });
    }
    
    console.log('✅ Page légale mise à jour');
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('❌ Erreur mise à jour page légale:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint pour récupérer un utilisateur par ID
app.get('/api/users/:id', async (req, res) => {
  try {
    console.log('👤 Récupération de l\'utilisateur:', req.params.id);
    
    const result = await pool.query(`
      SELECT 
        id, 
        email, 
        full_name, 
        first_name, 
        last_name,
        is_admin, 
        created_at,
        updated_at,
        phone,
        company,
        city,
        avatar_url
      FROM profiles 
      WHERE id = $1
    `, [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Utilisateur non trouvé' });
    }
    
    console.log('✅ Utilisateur récupéré');
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('❌ Erreur récupération utilisateur:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint pour mettre à jour un utilisateur
app.put('/api/users/:id', async (req, res) => {
  try {
    console.log(`👤 Mise à jour de l'utilisateur: ${req.params.id}`);
    
    const updateData = req.body;
    const userId = req.params.id;
    
    // Construire la requête de mise à jour dynamiquement
    const fields = [];
    const values = [];
    let paramIndex = 1;
    
    for (const [key, value] of Object.entries(updateData)) {
      if (key !== 'id' && value !== undefined) {
        fields.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }
    
    if (fields.length === 0) {
      return res.status(400).json({ success: false, error: 'Aucune donnée à mettre à jour' });
    }
    
    // Ajouter updated_at
    fields.push(`updated_at = $${paramIndex}`);
    values.push(new Date().toISOString());
    paramIndex++;
    
    // Ajouter l'ID à la fin
    values.push(userId);
    
    const query = `
      UPDATE profiles 
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;
    
    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Utilisateur non trouvé' });
    }
    
    console.log('✅ Utilisateur mis à jour');
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('❌ Erreur mise à jour utilisateur:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint pour récupérer les documents d'un utilisateur
app.get('/api/users/:id/documents', async (req, res) => {
  try {
    console.log(`📄 Récupération des documents pour l'utilisateur: ${req.params.id}`);
    
    // Vérifier si la table existe
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'profile_documents'
      );
    `);
    
    if (!tableExists.rows[0].exists) {
      console.log('⚠️ Table profile_documents n\'existe pas, retour de liste vide');
      return res.json({ success: true, data: [] });
    }
    
    const result = await pool.query(`
      SELECT * FROM profile_documents 
      WHERE user_id = $1
      ORDER BY uploaded_at DESC
    `, [req.params.id]);
    
    console.log('✅ Documents récupérés:', result.rows.length);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('❌ Erreur récupération documents:', error);
    // En cas d'erreur, retourner une liste vide plutôt qu'une erreur
    res.json({ success: true, data: [] });
  }
});

// Endpoints pour les créneaux horaires
app.get('/api/time-slots', async (req, res) => {
  try {
    console.log('🕐 Récupération des créneaux horaires');
    
    const result = await pool.query(`
      SELECT * FROM time_slots 
      ORDER BY display_order ASC
    `);
    
    console.log('✅ Créneaux horaires récupérés:', result.rows.length);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('❌ Erreur récupération créneaux:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/time-slots', async (req, res) => {
  try {
    console.log('🕐 Création d\'un créneau horaire');
    
    const { name, start_time, end_time, duration_minutes, is_available, price, space_id } = req.body;
    
    const result = await pool.query(`
      INSERT INTO time_slots (name, start_time, end_time, duration_minutes, is_available, price, space_id, display_order, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, (SELECT COALESCE(MAX(display_order), 0) + 1 FROM time_slots), $8, $9)
      RETURNING *
    `, [name, start_time, end_time, duration_minutes, is_available, price, space_id, new Date().toISOString(), new Date().toISOString()]);
    
    console.log('✅ Créneau horaire créé');
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('❌ Erreur création créneau:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/time-slots/:id', async (req, res) => {
  try {
    console.log(`🕐 Mise à jour du créneau horaire: ${req.params.id}`);
    
    const updateData = req.body;
    const timeSlotId = req.params.id;
    
    // Construire la requête de mise à jour dynamiquement
    const fields = [];
    const values = [];
    let paramIndex = 1;
    
    for (const [key, value] of Object.entries(updateData)) {
      if (key !== 'id' && value !== undefined) {
        fields.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }
    
    if (fields.length === 0) {
      return res.status(400).json({ success: false, error: 'Aucune donnée à mettre à jour' });
    }
    
    // Ajouter updated_at
    fields.push(`updated_at = $${paramIndex}`);
    values.push(new Date().toISOString());
    paramIndex++;
    
    // Ajouter l'ID à la fin
    values.push(timeSlotId);
    
    const query = `
      UPDATE time_slots 
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;
    
    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Créneau horaire non trouvé' });
    }
    
    console.log('✅ Créneau horaire mis à jour');
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('❌ Erreur mise à jour créneau:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/time-slots/:id', async (req, res) => {
  try {
    console.log(`🕐 Suppression du créneau horaire: ${req.params.id}`);
    
    const result = await pool.query(`
      DELETE FROM time_slots 
      WHERE id = $1
    `, [req.params.id]);
    
    console.log('✅ Créneau horaire supprimé');
    res.json({ success: true, message: 'Créneau horaire supprimé avec succès' });
  } catch (error) {
    console.error('❌ Erreur suppression créneau:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/time-slots/swap-orders', async (req, res) => {
  try {
    console.log('🔄 Échange des ordres de créneaux horaires');
    
    const { firstSlotId, firstSlotOrder, secondSlotId, secondSlotOrder } = req.body;
    
    // Échanger les ordres
    await pool.query(`
      UPDATE time_slots 
      SET display_order = $1, updated_at = $2
      WHERE id = $3
    `, [secondSlotOrder, new Date().toISOString(), firstSlotId]);
    
    await pool.query(`
      UPDATE time_slots 
      SET display_order = $1, updated_at = $2
      WHERE id = $3
    `, [firstSlotOrder, new Date().toISOString(), secondSlotId]);
    
    console.log('✅ Ordres échangés');
    res.json({ success: true, message: 'Ordres échangés avec succès' });
  } catch (error) {
    console.error('❌ Erreur échange ordres:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint pour réorganiser les images du carrousel
app.put('/api/carousel-images/reorder', async (req, res) => {
  try {
    console.log('🔄 Réorganisation des images du carrousel');
    
    const { images } = req.body;
    
    if (!images || !Array.isArray(images)) {
      return res.status(400).json({ success: false, error: 'Données d\'images invalides' });
    }
    
    // Mettre à jour l'ordre de chaque image
    for (const image of images) {
      await pool.query(`
        UPDATE carousel_images 
        SET display_order = $1, updated_at = $2
        WHERE id = $3
      `, [image.display_order, new Date().toISOString(), image.id]);
    }
    
    console.log('✅ Images réorganisées');
    res.json({ success: true, message: 'Images réorganisées avec succès' });
  } catch (error) {
    console.error('❌ Erreur réorganisation images:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint pour supprimer un document d'un utilisateur
app.delete('/api/users/:userId/documents/:documentId', async (req, res) => {
  try {
    console.log(`📄 Suppression du document: ${req.params.documentId} pour l'utilisateur: ${req.params.userId}`);
    
    // Vérifier si la table existe
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'profile_documents'
      );
    `);
    
    if (!tableExists.rows[0].exists) {
      console.log('⚠️ Table profile_documents n\'existe pas');
      return res.json({ success: true, message: 'Table n\'existe pas' });
    }
    
    const result = await pool.query(`
      DELETE FROM profile_documents 
      WHERE id = $1 AND user_id = $2
    `, [req.params.documentId, req.params.userId]);
    
    console.log('✅ Document supprimé');
    res.json({ success: true, message: 'Document supprimé avec succès' });
  } catch (error) {
    console.error('❌ Erreur suppression document:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint pour récupérer les paramètres de l'entreprise
app.get('/api/company-settings', async (req, res) => {
  try {
    console.log('🏢 Récupération des paramètres de l\'entreprise');
    
    const result = await pool.query(`
      SELECT value FROM admin_settings 
      WHERE key = 'company'
      ORDER BY updated_at DESC
      LIMIT 1
    `);
    
    if (result.rows.length > 0) {
      console.log('✅ Paramètres entreprise récupérés');
      res.json({ success: true, data: result.rows[0].value });
    } else {
      console.log('⚠️ Aucun paramètre entreprise trouvé, retour de valeurs par défaut');
      // Retourner des valeurs par défaut
      const defaultCompanySettings = {
        name: "Votre Entreprise",
        email: "contact@votre-entreprise.com",
        phone: "+33 1 23 45 67 89",
        address: "123 Rue de la Paix\n75001 Paris, France",
        website: "https://www.votre-entreprise.com",
        description: "Une entreprise innovante",
        logo_url: "",
        siret: "",
        vat_number: ""
      };
      res.json({ success: true, data: defaultCompanySettings });
    }
  } catch (error) {
    console.error('❌ Erreur récupération paramètres entreprise:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint pour sauvegarder les paramètres de l'entreprise
app.post('/api/company-settings', async (req, res) => {
  try {
    console.log('🏢 Sauvegarde des paramètres de l\'entreprise');
    
    const companyData = req.body;
    
    const result = await pool.query(`
      INSERT INTO admin_settings (key, value, updated_at)
      VALUES ('company', $1, $2)
      ON CONFLICT (key) 
      DO UPDATE SET 
        value = EXCLUDED.value,
        updated_at = EXCLUDED.updated_at
      RETURNING *
    `, [JSON.stringify(companyData), new Date().toISOString()]);
    
    console.log('✅ Paramètres entreprise sauvegardés');
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('❌ Erreur sauvegarde paramètres entreprise:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint de debug pour voir toutes les données
app.get('/api/debug-homepage', async (req, res) => {
  try {
    const allData = await pool.query(`
      SELECT key, value, updated_at FROM admin_settings 
      ORDER BY updated_at DESC
    `);
    console.log('🔍 Toutes les données admin_settings:', allData.rows);
    res.json({ success: true, data: allData.rows });
  } catch (error) {
    console.error('❌ Erreur debug:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint pour récupérer les paramètres homepage
app.get('/api/homepage-settings', async (req, res) => {
  try {
    console.log('🏠 Récupération des paramètres homepage...');
    console.log('🏠 ENDPOINT GET HOMEPAGE CALLED');
    
    // D'abord, voir toutes les clés disponibles
    const allKeys = await pool.query(`
      SELECT key, updated_at FROM admin_settings 
      ORDER BY updated_at DESC
    `);
    console.log('🔍 Toutes les clés disponibles:', allKeys.rows);
    
    // Récupérer depuis admin_settings avec la clé 'homepage'
    const result = await pool.query(`
      SELECT value FROM admin_settings 
      WHERE key = $1
      ORDER BY updated_at DESC 
      LIMIT 1
    `, ['homepage']);
    
    console.log('🔍 Résultat de la requête:', result.rows);
    console.log('🔍 Nombre de lignes trouvées:', result.rows.length);
    
    if (result.rows.length === 0) {
      console.log('🏠 Aucun paramètre homepage trouvé, retour de données par défaut');
      res.json({ 
        success: true, 
        data: {
          title: 'CoWorkMy',
          subtitle: 'Votre espace de coworking',
          description: 'Découvrez nos espaces de coworking modernes',
          backgroundImage: 'https://images.unsplash.com/photo-1600508774636-7b8fHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80'
        }
      });
      return;
    }
    
    console.log('✅ Paramètres homepage récupérés:', result.rows[0].value);
    res.json({ success: true, data: result.rows[0].value });
  } catch (error) {
    console.error('❌ Erreur récupération paramètres homepage:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint pour sauvegarder les paramètres homepage
app.post('/api/homepage-settings', async (req, res) => {
  try {
    console.log('🏠 Sauvegarde des paramètres homepage...');
    
    const settings = req.body;
    
    // Sauvegarder dans admin_settings avec la clé 'homepage'
    const result = await pool.query(`
      INSERT INTO admin_settings (key, value, updated_at)
      VALUES ($1, $2, $3)
      ON CONFLICT (key) DO UPDATE SET
        value = EXCLUDED.value,
        updated_at = EXCLUDED.updated_at
      RETURNING *
    `, [
      'homepage',
      JSON.stringify(settings),
      new Date().toISOString()
    ]);
    
    console.log('✅ Paramètres homepage sauvegardés');
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('❌ Erreur sauvegarde paramètres homepage:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint pour sauvegarder les paramètres admin
app.post('/api/admin/settings', async (req, res) => {
  try {
    console.log('⚙️ Sauvegarde des paramètres admin...');
    
    const settings = req.body;
    
    // Vérifier si la table existe
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'admin_settings'
      );
    `);
    
    if (!tableExists.rows[0].exists) {
      console.log('⚙️ Table admin_settings n\'existe pas, retour de succès simulé');
      res.json({ success: true, data: settings });
      return;
    }
    
    // Sauvegarder les paramètres
    const result = await pool.query(`
      INSERT INTO admin_settings (key, value, updated_at)
      VALUES ($1, $2, $3)
      ON CONFLICT (key) DO UPDATE SET
        value = EXCLUDED.value,
        updated_at = EXCLUDED.updated_at
      RETURNING *
    `, [
      settings.key || 'general',
      JSON.stringify(settings.value || settings),
      new Date().toISOString()
    ]);
    
    console.log('✅ Paramètres admin sauvegardés');
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('❌ Erreur sauvegarde paramètres admin:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint pour récupérer les images du carrousel
app.get('/api/carousel-images', async (req, res) => {
  try {
    console.log('🖼️ Récupération des images du carrousel...');
    
    // Vérifier si la table existe
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'carousel_images'
      );
    `);
    
    if (!tableExists.rows[0].exists) {
      console.log('🖼️ Table carousel_images n\'existe pas, retour de données par défaut');
      res.json({ success: true, data: [] });
      return;
    }
    
    // Vérifier la structure de la table
    const tableInfo = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'carousel_images'
    `);
    
    console.log('📋 Structure de la table carousel_images:', tableInfo.rows);
    
    // Utiliser la structure existante
    const columns = tableInfo.rows.map(row => row.column_name);
    let selectQuery = 'SELECT * FROM carousel_images ORDER BY ';
    
    if (columns.includes('created_at')) {
      selectQuery += 'created_at DESC';
    } else if (columns.includes('id')) {
      selectQuery += 'id DESC';
    } else {
      selectQuery += '1';
    }
    
    const result = await pool.query(selectQuery);
    
    console.log(`✅ ${result.rows.length} images du carrousel récupérées`);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('❌ Erreur récupération images carrousel:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint pour ajouter une image au carrousel
app.post('/api/carousel-images', async (req, res) => {
  try {
    console.log('🖼️ Ajout d\'une image au carrousel...');
    
    const { image_url } = req.body;
    
    // Vérifier si la table existe
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'carousel_images'
      );
    `);
    
    if (!tableExists.rows[0].exists) {
      console.log('🖼️ Table carousel_images n\'existe pas, retour de succès simulé');
      res.json({ success: true, data: { id: Date.now(), url: image_url } });
      return;
    }
    
    // Vérifier la structure de la table
    const tableInfo = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'carousel_images'
    `);
    
    console.log('📋 Structure de la table carousel_images:', tableInfo.rows);
    
    const columns = tableInfo.rows.map(row => row.column_name);
    
    // Construire la requête d'insertion selon la structure existante
    let insertQuery = 'INSERT INTO carousel_images (';
    let valuesQuery = 'VALUES (';
    let params = [];
    let paramIndex = 1;
    
    if (columns.includes('url')) {
      insertQuery += 'url';
      valuesQuery += `$${paramIndex}`;
      params.push(image_url);
      paramIndex++;
    } else if (columns.includes('image_url')) {
      insertQuery += 'image_url';
      valuesQuery += `$${paramIndex}`;
      params.push(image_url);
      paramIndex++;
    }
    
    if (columns.includes('created_at')) {
      insertQuery += ', created_at';
      valuesQuery += `, $${paramIndex}`;
      params.push(new Date().toISOString());
      paramIndex++;
    }
    
    insertQuery += ') ';
    valuesQuery += ') RETURNING *';
    
    const result = await pool.query(insertQuery + valuesQuery, params);
    
    console.log('✅ Image ajoutée au carrousel');
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('❌ Erreur ajout image carrousel:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint pour supprimer une image du carrousel
app.delete('/api/carousel-images/:id', async (req, res) => {
  try {
    console.log(`🗑️ Suppression de l'image carrousel: ${req.params.id}`);
    
    // Vérifier si la table existe
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'carousel_images'
      );
    `);
    
    if (!tableExists.rows[0].exists) {
      console.log('🖼️ Table carousel_images n\'existe pas, retour de succès simulé');
      res.json({ success: true, data: { id: req.params.id } });
      return;
    }
    
    const result = await pool.query(`
      DELETE FROM carousel_images 
      WHERE id = $1
      RETURNING *
    `, [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Image non trouvée' });
    }
    
    console.log('✅ Image supprimée du carrousel');
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('❌ Erreur suppression image carrousel:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint pour créer un espace
app.post('/api/spaces', async (req, res) => {
  try {
    console.log('🏢 POST /api/spaces - Création d\'un espace...');
    console.log('📝 Données reçues:', req.body);
    
    const { name, description, capacity, price_per_hour, is_active } = req.body;
    
    // Vérifier que la table spaces existe
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'spaces'
      );
    `);
    
    if (!tableExists.rows[0].exists) {
      console.log('📋 Création de la table spaces...');
      await pool.query(`
        CREATE TABLE spaces (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          capacity INTEGER NOT NULL,
          price_per_hour DECIMAL(10,2),
          hourly_price DECIMAL(10,2) DEFAULT 0,
          daily_price DECIMAL(10,2) DEFAULT 0,
          half_day_price DECIMAL(10,2) DEFAULT 0,
          monthly_price DECIMAL(10,2) DEFAULT 0,
          quarter_price DECIMAL(10,2) DEFAULT 0,
          yearly_price DECIMAL(10,2) DEFAULT 0,
          custom_price DECIMAL(10,2) DEFAULT 0,
          custom_label VARCHAR(255),
          pricing_type VARCHAR(50) DEFAULT 'hourly',
          amenities TEXT[],
          image_url TEXT,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `);
      console.log('✅ Table spaces créée');
    }
    
    // Insérer l'espace
    const result = await pool.query(`
      INSERT INTO spaces (name, description, capacity, price_per_hour, is_active, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING *
    `, [name, description, capacity, price_per_hour, is_active]);
    
    console.log('✅ Espace créé:', result.rows[0]);
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('❌ Erreur création espace:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint pour modifier un espace
app.put('/api/spaces/:id', async (req, res) => {
  try {
    console.log('🏢 PUT /api/spaces/:id - Modification d\'un espace...');
    console.log('📝 ID:', req.params.id);
    console.log('📝 Données reçues:', req.body);
    
    const { id } = req.params;
    const updateData = req.body;
    
    // Vérifier que l'espace existe
    const existingSpace = await pool.query('SELECT * FROM spaces WHERE id = $1', [id]);
    
    if (existingSpace.rows.length === 0) {
      console.log('❌ Espace non trouvé:', id);
      return res.status(404).json({ success: false, error: 'Espace non trouvé' });
    }
    
    // Construire la requête de mise à jour dynamiquement
    const fields = [];
    const values = [];
    let paramIndex = 1;
    
    // Liste des colonnes valides pour la table spaces
    const validColumns = [
      'name', 'description', 'capacity', 'price_per_hour', 'hourly_price', 
      'daily_price', 'half_day_price', 'monthly_price', 'quarter_price', 
      'yearly_price', 'custom_price', 'custom_label', 'pricing_type', 
      'amenities', 'image_url', 'is_active', 'stripe_product_id', 
      'stripe_price_id', 'last_stripe_sync'
    ];
    
    for (const [key, value] of Object.entries(updateData)) {
      if (key !== 'id' && value !== undefined && validColumns.includes(key)) {
        fields.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }
    
    if (fields.length === 0) {
      return res.status(400).json({ success: false, error: 'Aucune donnée à mettre à jour' });
    }
    
    // Ajouter updated_at
    fields.push(`updated_at = $${paramIndex}`);
    values.push(new Date().toISOString());
    paramIndex++;
    
    // Ajouter l'ID à la fin
    values.push(id);
    
    const query = `
      UPDATE spaces 
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;
    
    const result = await pool.query(query, values);
    
    console.log('✅ Espace modifié:', result.rows[0]);
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('❌ Erreur modification espace:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint pour récupérer un espace spécifique
app.get('/api/spaces/:id', async (req, res) => {
  try {
    console.log('🏢 GET /api/spaces/:id - Récupération d\'un espace...');
    console.log('📝 ID:', req.params.id);
    
    const { id } = req.params;
    
    // Récupérer l'espace
    const result = await pool.query('SELECT * FROM spaces WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      console.log('❌ Espace non trouvé:', id);
      return res.status(404).json({ success: false, error: 'Espace non trouvé' });
    }
    
    console.log('✅ Espace récupéré:', result.rows[0]);
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('❌ Erreur récupération espace:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint pour supprimer un espace
app.delete('/api/spaces/:id', async (req, res) => {
  try {
    console.log('🏢 DELETE /api/spaces/:id - Suppression d\'un espace...');
    console.log('📝 ID:', req.params.id);
    
    const { id } = req.params;
    
    // Vérifier que l'espace existe
    const existingSpace = await pool.query('SELECT * FROM spaces WHERE id = $1', [id]);
    
    if (existingSpace.rows.length === 0) {
      console.log('❌ Espace non trouvé:', id);
      return res.status(404).json({ success: false, error: 'Espace non trouvé' });
    }
    
    // Supprimer l'espace
    await pool.query('DELETE FROM spaces WHERE id = $1', [id]);
    
    console.log('✅ Espace supprimé:', id);
    res.json({ success: true, message: 'Espace supprimé avec succès' });
  } catch (error) {
    console.error('❌ Erreur suppression espace:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint de test simple
app.get('/api/test-simple', (req, res) => {
  res.json({ success: true, message: 'API fonctionnelle', timestamp: new Date().toISOString() });
});

// Fonction pour récupérer la configuration Stripe
const getStripeConfig = async () => {
  try {
    const result = await pool.query(`
      SELECT value FROM admin_settings 
      WHERE key = 'stripe' 
      ORDER BY updated_at DESC 
      LIMIT 1
    `);
    
    if (result.rows.length === 0) {
      throw new Error('Configuration Stripe non trouvée');
    }
    
    // Le value est stocké comme une chaîne JSON, il faut la parser
    const config = typeof result.rows[0].value === 'string' 
      ? JSON.parse(result.rows[0].value) 
      : result.rows[0].value;
    
    console.log('🔧 Configuration Stripe récupérée:', {
      mode: config.mode,
      hasTestSecret: !!config.test_secret_key,
      hasLiveSecret: !!config.live_secret_key
    });
    
    const secretKey = config.mode === 'live' ? config.live_secret_key : config.test_secret_key;
    const publishableKey = config.mode === 'live' ? config.live_publishable_key : config.test_publishable_key;
    const webhookSecret = config.mode === 'live' ? config.live_webhook_secret : config.webhook_secret;
    
    if (!secretKey) {
      throw new Error(`Clé secrète Stripe manquante pour le mode ${config.mode}`);
    }
    
    return {
      secretKey,
      publishableKey,
      webhookSecret,
      mode: config.mode || 'test'
    };
  } catch (error) {
    console.error('Erreur récupération config Stripe:', error);
    throw error;
  }
};

// Endpoint pour tester la connexion Stripe
app.get('/api/stripe/test-connection', async (req, res) => {
  try {
    console.log('🔗 GET /api/stripe/test-connection - Test connexion Stripe...');
    
    const config = await getStripeConfig();
    const stripe = new Stripe(config.secretKey);
    
    // Tester la connexion en récupérant le compte
    const account = await stripe.accounts.retrieve();
    
    console.log('✅ Connexion Stripe réussie:', account.id);
    res.json({
      success: true,
      message: 'Connexion Stripe réussie',
      account: {
        id: account.id,
        country: account.country,
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
        details_submitted: account.details_submitted
      },
      mode: config.mode
    });
  } catch (error) {
    console.error('❌ Erreur connexion Stripe:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Erreur de connexion à Stripe'
    });
  }
});

// Endpoint pour synchroniser un espace avec Stripe
app.post('/api/stripe/sync-space/:spaceId', async (req, res) => {
  try {
    console.log('🔄 POST /api/stripe/sync-space/:spaceId - Synchronisation espace Stripe...');
    console.log('📝 Space ID:', req.params.spaceId);
    
    const { spaceId } = req.params;
    const config = await getStripeConfig();
    const stripe = new Stripe(config.secretKey);
    
    // Récupérer l'espace depuis la base de données
    const spaceResult = await pool.query('SELECT * FROM spaces WHERE id = $1', [spaceId]);
    
    if (spaceResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Espace non trouvé' });
    }
    
    const space = spaceResult.rows[0];
    console.log('📋 Espace trouvé:', space.name);
    
    // Vérifier si un produit Stripe existe déjà pour cet espace
    let product;
    if (space.stripe_product_id) {
      try {
        // Récupérer le produit existant
        product = await stripe.products.retrieve(space.stripe_product_id);
        console.log('✅ Produit Stripe existant trouvé:', product.id);
      } catch (error) {
        console.log('⚠️ Produit Stripe existant introuvable, création d\'un nouveau...');
        product = null;
      }
    }
    
    if (!product) {
      // Créer un nouveau produit Stripe
      product = await stripe.products.create({
        name: space.name,
        description: space.description,
        metadata: {
          space_id: space.id,
          capacity: space.capacity.toString(),
          amenities: JSON.stringify(space.amenities || [])
        }
      });
      console.log('✅ Nouveau produit Stripe créé:', product.id);
    }
    
    // Créer les prix selon le type de tarification
    const prices = [];
    
    // Vérifier si un prix existe déjà pour cet espace
    let price = null;
    if (space.stripe_price_id) {
      try {
        // Récupérer le prix existant
        price = await stripe.prices.retrieve(space.stripe_price_id);
        console.log('✅ Prix existant trouvé:', price.id);
      } catch (error) {
        console.log('⚠️ Prix existant introuvable, création d\'un nouveau...');
        price = null;
      }
    }
    
    if (!price && space.pricing_type === 'hourly' && space.hourly_price > 0) {
      price = await stripe.prices.create({
        product: product.id,
        unit_amount: Math.round(space.hourly_price * 100), // Convertir en centimes
        currency: 'eur',
        metadata: {
          space_id: space.id,
          pricing_type: 'hourly'
        }
      });
      console.log('✅ Nouveau prix créé:', price.id);
    }
    
    if (price) {
      prices.push({ type: 'hourly', price_id: price.id, amount: space.hourly_price });
    }
    
    if (space.pricing_type === 'daily' && space.daily_price > 0) {
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: Math.round(space.daily_price * 100),
        currency: 'eur',
        metadata: {
          space_id: space.id,
          pricing_type: 'daily'
        }
      });
      prices.push({ type: 'daily', price_id: price.id, amount: space.daily_price });
    }
    
    if (space.pricing_type === 'monthly' && space.monthly_price > 0) {
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: Math.round(space.monthly_price * 100),
        currency: 'eur',
        recurring: {
          interval: 'month'
        },
        metadata: {
          space_id: space.id,
          pricing_type: 'monthly'
        }
      });
      prices.push({ type: 'monthly', price_id: price.id, amount: space.monthly_price });
    }
    
    // Mettre à jour l'espace avec les IDs Stripe
    await pool.query(`
      UPDATE spaces 
      SET stripe_product_id = $1, 
          stripe_price_id = $2,
          last_stripe_sync = NOW(),
          updated_at = NOW()
      WHERE id = $3
    `, [
      product.id,
      prices.length > 0 ? prices[0].price_id : null,
      spaceId
    ]);
    
    console.log('✅ Espace synchronisé avec Stripe');
    res.json({
      success: true,
      message: `Espace "${space.name}" synchronisé avec Stripe`,
      data: {
        space_id: space.id,
        stripe_product_id: product.id,
        prices: prices,
        mode: config.mode
      }
    });
  } catch (error) {
    console.error('❌ Erreur synchronisation Stripe:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Erreur lors de la synchronisation avec Stripe'
    });
  }
});

// Endpoint pour synchroniser tous les espaces
app.post('/api/stripe/sync-all', async (req, res) => {
  try {
    console.log('🔄 POST /api/stripe/sync-all - Synchronisation de tous les espaces...');
    
    const config = await getStripeConfig();
    const stripe = new Stripe(config.secretKey);
    
    // Récupérer tous les espaces actifs
    const spacesResult = await pool.query(`
      SELECT * FROM spaces 
      WHERE is_active = true 
      ORDER BY created_at DESC
    `);
    
    const spaces = spacesResult.rows;
    console.log(`📋 ${spaces.length} espaces à synchroniser`);
    
    const results = [];
    
    for (const space of spaces) {
      try {
        console.log(`🔄 Synchronisation: ${space.name}`);
        
        // Vérifier si un produit Stripe existe déjà pour cet espace
        let product;
        if (space.stripe_product_id) {
          try {
            // Récupérer le produit existant
            product = await stripe.products.retrieve(space.stripe_product_id);
            console.log(`✅ Produit existant trouvé pour ${space.name}:`, product.id);
          } catch (error) {
            console.log(`⚠️ Produit existant introuvable pour ${space.name}, création d'un nouveau...`);
            product = null;
          }
        }
        
        if (!product) {
          // Créer un nouveau produit Stripe
          product = await stripe.products.create({
            name: space.name,
            description: space.description,
            metadata: {
              space_id: space.id,
              capacity: space.capacity.toString(),
              amenities: JSON.stringify(space.amenities || [])
            }
          });
          console.log(`✅ Nouveau produit créé pour ${space.name}:`, product.id);
        }
        
        // Vérifier si un prix existe déjà pour cet espace
        let price = null;
        if (space.stripe_price_id) {
          try {
            // Récupérer le prix existant
            price = await stripe.prices.retrieve(space.stripe_price_id);
            console.log(`✅ Prix existant trouvé pour ${space.name}:`, price.id);
          } catch (error) {
            console.log(`⚠️ Prix existant introuvable pour ${space.name}, création d'un nouveau...`);
            price = null;
          }
        }
        
        if (!price && space.hourly_price > 0) {
          // Créer un nouveau prix
          price = await stripe.prices.create({
            product: product.id,
            unit_amount: Math.round(space.hourly_price * 100),
            currency: 'eur',
            metadata: {
              space_id: space.id,
              pricing_type: 'hourly'
            }
          });
          console.log(`✅ Nouveau prix créé pour ${space.name}:`, price.id);
        }
        
        // Mettre à jour l'espace
        await pool.query(`
          UPDATE spaces 
          SET stripe_product_id = $1, 
              stripe_price_id = $2,
              last_stripe_sync = NOW(),
              updated_at = NOW()
          WHERE id = $3
        `, [product.id, price?.id || null, space.id]);
        
        results.push({
          space_id: space.id,
          space_name: space.name,
          success: true,
          stripe_product_id: product.id,
          stripe_price_id: price?.id || null
        });
        
        console.log(`✅ ${space.name} synchronisé`);
      } catch (spaceError) {
        console.error(`❌ Erreur pour ${space.name}:`, spaceError);
        results.push({
          space_id: space.id,
          space_name: space.name,
          success: false,
          error: spaceError.message
        });
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    const errorCount = results.filter(r => !r.success).length;
    
    console.log(`✅ Synchronisation terminée: ${successCount} succès, ${errorCount} erreurs`);
    res.json({
      success: true,
      message: `Synchronisation terminée: ${successCount}/${spaces.length} espaces synchronisés`,
      data: {
        total: spaces.length,
        success: successCount,
        errors: errorCount,
        results: results,
        mode: config.mode
      }
    });
  } catch (error) {
    console.error('❌ Erreur synchronisation globale:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Erreur lors de la synchronisation globale'
    });
  }
});

// Endpoint pour vérifier le statut de synchronisation
app.get('/api/stripe/sync-status', async (req, res) => {
  try {
    console.log('📊 GET /api/stripe/sync-status - Vérification statut synchronisation...');
    
    const config = await getStripeConfig();
    
    // Récupérer les espaces avec leur statut Stripe
    const spacesResult = await pool.query(`
      SELECT id, name, stripe_product_id, stripe_price_id, last_stripe_sync, is_active
      FROM spaces 
      ORDER BY created_at DESC
    `);
    
    const spaces = spacesResult.rows;
    const syncedSpaces = spaces.filter(s => s.stripe_product_id && s.stripe_price_id);
    const unsyncedSpaces = spaces.filter(s => !s.stripe_product_id || !s.stripe_price_id);
    const activeSpaces = spaces.filter(s => s.is_active);
    
    console.log(`📊 Statut: ${syncedSpaces.length}/${spaces.length} espaces synchronisés`);
    res.json({
      success: true,
      data: {
        total: spaces.length,
        active: activeSpaces.length,
        synced: syncedSpaces.length,
        unsynced: unsyncedSpaces.length,
        mode: config.mode,
        spaces: spaces.map(s => ({
          id: s.id,
          name: s.name,
          is_active: s.is_active,
          is_synced: !!(s.stripe_product_id && s.stripe_price_id),
          last_sync: s.last_stripe_sync
        }))
      }
    });
  } catch (error) {
    console.error('❌ Erreur vérification statut:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Erreur lors de la vérification du statut'
    });
  }
});

// Endpoint pour migrer la table spaces
app.post('/api/migrate-spaces', async (req, res) => {
  try {
    console.log('🔄 POST /api/migrate-spaces - Migration de la table spaces...');
    
    // Ajouter les colonnes de prix
    console.log('➕ Ajout des colonnes de prix...');
    await pool.query('ALTER TABLE spaces ADD COLUMN IF NOT EXISTS hourly_price DECIMAL(10,2) DEFAULT 0');
    await pool.query('ALTER TABLE spaces ADD COLUMN IF NOT EXISTS daily_price DECIMAL(10,2) DEFAULT 0');
    await pool.query('ALTER TABLE spaces ADD COLUMN IF NOT EXISTS half_day_price DECIMAL(10,2) DEFAULT 0');
    await pool.query('ALTER TABLE spaces ADD COLUMN IF NOT EXISTS monthly_price DECIMAL(10,2) DEFAULT 0');
    await pool.query('ALTER TABLE spaces ADD COLUMN IF NOT EXISTS quarter_price DECIMAL(10,2) DEFAULT 0');
    await pool.query('ALTER TABLE spaces ADD COLUMN IF NOT EXISTS yearly_price DECIMAL(10,2) DEFAULT 0');
    await pool.query('ALTER TABLE spaces ADD COLUMN IF NOT EXISTS custom_price DECIMAL(10,2) DEFAULT 0');
    
    // Ajouter les colonnes de configuration
    console.log('➕ Ajout des colonnes de configuration...');
    await pool.query('ALTER TABLE spaces ADD COLUMN IF NOT EXISTS custom_label VARCHAR(255)');
    await pool.query('ALTER TABLE spaces ADD COLUMN IF NOT EXISTS pricing_type VARCHAR(50) DEFAULT \'hourly\'');
    await pool.query('ALTER TABLE spaces ADD COLUMN IF NOT EXISTS amenities TEXT[]');
    await pool.query('ALTER TABLE spaces ADD COLUMN IF NOT EXISTS image_url TEXT');
    
    // Ajouter les colonnes Stripe
    console.log('➕ Ajout des colonnes Stripe...');
    await pool.query('ALTER TABLE spaces ADD COLUMN IF NOT EXISTS stripe_product_id VARCHAR(255)');
    await pool.query('ALTER TABLE spaces ADD COLUMN IF NOT EXISTS stripe_price_id VARCHAR(255)');
    await pool.query('ALTER TABLE spaces ADD COLUMN IF NOT EXISTS last_stripe_sync TIMESTAMP');
    
    // Mettre à jour les données existantes
    console.log('🔄 Mise à jour des données existantes...');
    await pool.query(`
      UPDATE spaces SET 
        hourly_price = COALESCE(price_per_hour, 0),
        daily_price = COALESCE(price_per_hour * 8, 0),
        half_day_price = COALESCE(price_per_hour * 4, 0),
        monthly_price = COALESCE(price_per_hour * 160, 0),
        pricing_type = 'hourly'
      WHERE hourly_price IS NULL OR hourly_price = 0
    `);
    
    console.log('✅ Migration terminée avec succès!');
    res.json({ success: true, message: 'Migration terminée avec succès' });
  } catch (error) {
    console.error('❌ Erreur migration:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Gestion des erreurs
app.use((err, req, res, next) => {
  console.error('Erreur API:', err);
  res.status(500).json({ error: 'Erreur serveur interne' });
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`🚀 Serveur API démarré sur le port ${PORT}`);
  console.log(`📊 Base de données: ${process.env.DB_NAME || 'coworkmy'}`);
  console.log(`🎫 Système de tickets de support uniquement`);
});
