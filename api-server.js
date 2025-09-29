import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
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
app.use(express.json());

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
app.get('/api/spaces', (req, res) => {
  res.json({ 
    success: true, 
    data: [],
    message: 'Aucun espace disponible' 
  });
});

// Endpoints pour les paramètres de la page d'accueil
app.get('/api/homepage-settings', (req, res) => {
  res.json({ 
    success: true, 
    data: {
      title: 'CoWorkMy',
      subtitle: 'Votre espace de coworking',
      description: 'Découvrez nos espaces de coworking modernes',
      backgroundImage: 'https://images.unsplash.com/photo-1600508774636-7b38d81b5a87?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80'
    },
    message: 'Paramètres par défaut' 
  });
});

// Endpoints pour les images du carrousel
app.get('/api/carousel-images', (req, res) => {
  res.json({ 
    success: true, 
    data: [
      {
        id: '1',
        url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80',
        title: 'Espace de travail moderne',
        description: 'Un environnement propice à la productivité'
      },
      {
        id: '2', 
        url: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80',
        title: 'Salle de réunion',
        description: 'Idéale pour vos réunions d\'équipe'
      }
    ],
    message: 'Images du carrousel' 
  });
});

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
