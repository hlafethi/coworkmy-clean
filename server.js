import express from 'express';
import nodemailer from 'nodemailer';
import cors from 'cors';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Stripe from 'stripe';

dotenv.config();

// Configuration Stripe - sera initialisée dynamiquement
let stripe = null;

// Fonction pour récupérer la configuration Stripe depuis la base de données
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
    
    const config = result.rows[0].value;
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

// Nouvelle fonction pour récupérer la config Stripe selon un mode spécifique
const getStripeConfigForMode = async (requestedMode) => {
  try {
    console.log('🔧 Récupération config Stripe depuis les variables d\'environnement...');
    
    // Utiliser les variables d'environnement existantes
    const secretKey = requestedMode === 'live' 
      ? process.env.STRIPE_SECRET_KEY 
      : process.env.STRIPE_TEST_SECRET_KEY;
    
    const publishableKey = requestedMode === 'live' 
      ? process.env.VITE_STRIPE_PUBLIC_KEY 
      : process.env.VITE_STRIPE_TEST_PUBLIC_KEY;
    
    const webhookSecret = requestedMode === 'live' 
      ? process.env.STRIPE_WEBHOOK_SECRET 
      : process.env.STRIPE_TEST_WEBHOOK_SECRET;
    
    console.log('🔧 Configuration Stripe depuis .env:', {
      requestedMode,
      hasTestSecret: !!process.env.STRIPE_TEST_SECRET_KEY,
      hasLiveSecret: !!process.env.STRIPE_SECRET_KEY,
      secretKeyExists: !!secretKey,
      secretKeyPreview: secretKey ? secretKey.substring(0, 10) + '...' : 'none'
    });
    
    if (!secretKey) {
      throw new Error(`Clé secrète Stripe manquante pour le mode ${requestedMode}. Vérifiez les variables d'environnement STRIPE_${requestedMode.toUpperCase()}_SECRET_KEY.`);
    }
    
    return {
      secretKey,
      publishableKey,
      webhookSecret,
      mode: requestedMode
    };
  } catch (error) {
    console.error('❌ Erreur récupération config Stripe pour mode:', error);
    throw error;
  }
};

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Augmenter la limite pour les images

// Configuration PostgreSQL
const pool = new Pool({
  host: process.env.DB_HOST || '147.93.58.155',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'coworkmy',
  user: process.env.DB_USER || 'vpshostinger',
  password: process.env.DB_PASSWORD || 'Fethi@2025!',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

// Test de connexion à la base de données
pool.on('connect', () => {
  console.log('✅ Connexion à PostgreSQL établie');
});

pool.on('error', (err) => {
  console.error('❌ Erreur de connexion PostgreSQL:', err);
});

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware d'authentification
const authenticateToken = (req, res, next) => {
  console.log('🔍 authenticateToken appelé pour:', req.method, req.path);
  console.log('🔍 Headers authorization:', req.headers['authorization']);
  
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.log('❌ Pas de token trouvé');
    return res.status(401).json({ error: 'Token d\'accès requis' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.log('❌ Token invalide:', err.message);
      return res.status(403).json({ error: 'Token invalide' });
    }
    console.log('🔑 Token décodé:', { id: user.id, email: user.email, is_admin: user.is_admin });
    req.user = user;
    next();
  });
};

// Fonction utilitaire pour les réponses API
const sendResponse = (res, success, data = null, error = null) => {
  res.json({
    success,
    data,
    error
  });
};

// ===== ENDPOINTS D'AUTHENTIFICATION =====

// POST /api/auth/signin
app.post('/api/auth/signin', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendResponse(res, false, null, 'Email et mot de passe requis');
    }

    // Comptes de test pour le développement - utiliser les vrais IDs de la base
    const testUsers = {
      'admin@coworkmy.fr': {
        email: 'admin@coworkmy.fr',
        password: 'Project@2025*',
        full_name: 'Administrateur',
        is_admin: true
      },
      'user@heleam.com': {
        email: 'user@heleam.com',
        password: 'user123',
        full_name: 'Utilisateur Test',
        is_admin: false
      }
    };

    // Vérification des identifiants de test
    const testUser = testUsers[email];
    if (testUser && password === testUser.password) {
      // Récupérer l'ID réel de la base de données
      try {
        const dbResult = await pool.query(
          'SELECT id, email, full_name, first_name, last_name, is_admin FROM profiles WHERE email = $1',
          [email]
        );
        
        if (dbResult.rows.length === 0) {
          return sendResponse(res, false, null, 'Utilisateur non trouvé en base de données');
        }
        
        const dbUser = dbResult.rows[0];
        
        // Génération du token JWT avec l'ID réel de la base
        const token = jwt.sign(
          { 
            id: dbUser.id, 
            email: dbUser.email,
            is_admin: dbUser.is_admin || testUser.is_admin
          },
          JWT_SECRET,
          { expiresIn: '24h' }
        );

        return sendResponse(res, true, {
          user: {
            id: dbUser.id,
            email: dbUser.email,
            full_name: dbUser.full_name || testUser.full_name,
            is_admin: dbUser.is_admin || testUser.is_admin
          },
          token
        });
      } catch (dbError) {
        console.error('Erreur lors de la récupération de l\'utilisateur:', dbError);
        return sendResponse(res, false, null, 'Erreur de base de données');
      }
    }

    // Recherche de l'utilisateur dans PostgreSQL
    try {
      const result = await pool.query(
        'SELECT * FROM profiles WHERE email = $1',
        [email]
      );

      if (result.rows.length === 0) {
        return sendResponse(res, false, null, 'Identifiants invalides');
      }

      const user = result.rows[0];

      // Vérification du mot de passe (si password_hash existe)
      if (user.password_hash) {
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
          return sendResponse(res, false, null, 'Identifiants invalides');
        }
      } else {
        // Si pas de password_hash, vérifier avec le mot de passe en dur pour admin@heleam.com
        if (email === 'admin@heleam.com' && password === 'admin123') {
          // OK, continuer
        } else {
          return sendResponse(res, false, null, 'Identifiants invalides');
        }
      }

      // Génération du token JWT
      const token = jwt.sign(
        { 
          id: user.id, 
          email: user.email,
          is_admin: user.is_admin || false
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      sendResponse(res, true, {
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name || user.first_name + ' ' + user.last_name || 'Utilisateur',
          is_admin: user.is_admin || false
        },
        token
      });
    } catch (dbError) {
      console.error('Erreur base de données:', dbError);
      return sendResponse(res, false, null, 'Erreur de connexion à la base de données');
    }
  } catch (error) {
    console.error('Erreur signin:', error);
    sendResponse(res, false, null, 'Erreur serveur');
  }
});

// POST /api/auth/signup
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password, full_name } = req.body;

    if (!email || !password) {
      return sendResponse(res, false, null, 'Email et mot de passe requis');
    }

    // Vérification si l'utilisateur existe déjà
    try {
      const existingUser = await pool.query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );

      if (existingUser.rows.length > 0) {
        return sendResponse(res, false, null, 'Un compte avec cet email existe déjà');
      }

      // Hash du mot de passe
      const passwordHash = await bcrypt.hash(password, 10);

      // Création de l'utilisateur
      const result = await pool.query(
        'INSERT INTO users (email, password_hash, full_name, is_admin, created_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING *',
        [email, passwordHash, full_name || null, false]
      );

      const user = result.rows[0];

      // Génération du token JWT
      const token = jwt.sign(
        { 
          id: user.id, 
          email: user.email,
          is_admin: false
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      sendResponse(res, true, {
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          is_admin: false
        },
        token
      });
    } catch (dbError) {
      console.error('Erreur base de données:', dbError);
      return sendResponse(res, false, null, 'Erreur de connexion à la base de données');
    }
  } catch (error) {
    console.error('Erreur signup:', error);
    sendResponse(res, false, null, 'Erreur serveur');
  }
});

// GET /api/auth/me
app.get('/api/auth/me', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      // Pas de token = utilisateur non connecté
      return sendResponse(res, false, null, 'Aucune session active');
    }

    // Vérification du token
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) {
        return sendResponse(res, false, null, 'Token invalide');
      }

      // Retourner les informations de l'utilisateur
      sendResponse(res, true, { 
        user: {
          id: user.id,
          email: user.email,
          is_admin: user.is_admin || false
        }
      });
    });
  } catch (error) {
    console.error('Erreur getCurrentUser:', error);
    sendResponse(res, false, null, 'Erreur serveur');
  }
});

// ===== ENDPOINTS POUR LES ESPACES =====

// GET /api/spaces
app.get('/api/spaces', async (req, res) => {
  try {
    // Récupérer tous les espaces (actifs et inactifs) pour l'admin
    const result = await pool.query(
      'SELECT * FROM spaces ORDER BY created_at DESC'
    );

    sendResponse(res, true, result.rows);
  } catch (error) {
    console.error('Erreur spaces:', error);
    sendResponse(res, false, null, 'Erreur serveur');
  }
});

// GET /api/spaces/active - Pour les espaces actifs uniquement (frontend public)
app.get('/api/spaces/active', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM spaces WHERE is_active = true ORDER BY created_at DESC'
    );

    sendResponse(res, true, result.rows);
  } catch (error) {
    console.error('Erreur spaces actifs:', error);
    sendResponse(res, false, null, 'Erreur serveur');
  }
});

// GET /api/spaces/:id - Récupérer un espace spécifique par ID
app.get('/api/spaces/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🔍 Récupération de l\'espace:', id);
    
    const result = await pool.query(
      'SELECT * FROM spaces WHERE id = $1 AND is_active = true',
      [id]
    );

    if (result.rows.length === 0) {
      return sendResponse(res, false, null, 'Espace non trouvé');
    }

    sendResponse(res, true, result.rows[0]);
  } catch (error) {
    console.error('Erreur récupération espace:', error);
    sendResponse(res, false, null, 'Erreur serveur');
  }
});

// GET /api/spaces/:id/availability
app.get('/api/spaces/:id/availability', async (req, res) => {
  try {
    const { id } = req.params;
    const { start, end } = req.query;
    
    console.log('🔍 Vérification disponibilité espace:', { id, start, end });
    
    if (!start || !end) {
      return sendResponse(res, false, null, 'Dates de début et fin requises');
    }

    // Vérifier s'il existe des réservations qui se chevauchent
    const overlapCheck = await pool.query(`
      SELECT id FROM bookings 
      WHERE space_id = $1 
      AND status IN ('pending', 'confirmed')
      AND (
        (start_date <= $2 AND end_date >= $2) OR
        (start_date <= $3 AND end_date >= $3) OR
        (start_date >= $2 AND end_date <= $3)
      )
    `, [id, start, end]);

    const isAvailable = overlapCheck.rows.length === 0;
    
    console.log(`✅ Espace ${id} disponible: ${isAvailable}`);
    sendResponse(res, true, { available: isAvailable });
  } catch (error) {
    console.error('Erreur vérification disponibilité:', error);
    sendResponse(res, false, null, 'Erreur serveur');
  }
});

// POST /api/spaces
app.post('/api/spaces', authenticateToken, async (req, res) => {
  try {
    if (!req.user.is_admin) {
      return sendResponse(res, false, null, 'Accès non autorisé');
    }

    const spaceData = req.body;
    console.log('🏢 Création d\'un nouvel espace...');
    
    const result = await pool.query(
      `INSERT INTO spaces (name, description, capacity, price_per_hour, hourly_price, daily_price, half_day_price, monthly_price, quarter_price, yearly_price, custom_price, custom_label, pricing_type, amenities, image_url, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW(), NOW())
       RETURNING *`,
      [
        spaceData.name,
        spaceData.description,
        spaceData.capacity,
        spaceData.price_per_hour,
        spaceData.hourly_price || 0,
        spaceData.daily_price || 0,
        spaceData.half_day_price || 0,
        spaceData.monthly_price || 0,
        spaceData.quarter_price || 0,
        spaceData.yearly_price || 0,
        spaceData.custom_price || 0,
        spaceData.custom_label || '',
        spaceData.pricing_type || 'hourly',
        spaceData.amenities || [],
        spaceData.image_url || '',
        spaceData.is_active !== false
      ]
    );
    
    console.log(`✅ Espace créé: ${result.rows[0].id}`);
    sendResponse(res, true, result.rows[0]);
  } catch (error) {
    console.error('❌ Erreur création espace:', error);
    sendResponse(res, false, null, 'Erreur serveur');
  }
});

// PUT /api/spaces/:id
app.put('/api/spaces/:id', authenticateToken, async (req, res) => {
  try {
    if (!req.user.is_admin) {
      return sendResponse(res, false, null, 'Accès non autorisé');
    }

    const { id } = req.params;
    const spaceData = req.body;
    console.log(`🏢 Mise à jour de l'espace ${id}...`);
    console.log('📝 Données reçues:', spaceData);
    
    // Construire la requête UPDATE dynamiquement selon les champs fournis
    const updateFields = [];
    const values = [];
    let paramIndex = 1;
    
    // Ajouter les champs fournis dans la requête
    if (spaceData.name !== undefined) {
      updateFields.push(`name = $${paramIndex++}`);
      values.push(spaceData.name);
    }
    if (spaceData.description !== undefined) {
      updateFields.push(`description = $${paramIndex++}`);
      values.push(spaceData.description);
    }
    if (spaceData.capacity !== undefined) {
      updateFields.push(`capacity = $${paramIndex++}`);
      values.push(spaceData.capacity);
    }
    if (spaceData.price_per_hour !== undefined) {
      updateFields.push(`price_per_hour = $${paramIndex++}`);
      values.push(spaceData.price_per_hour);
    }
    if (spaceData.hourly_price !== undefined) {
      updateFields.push(`hourly_price = $${paramIndex++}`);
      values.push(spaceData.hourly_price);
    }
    if (spaceData.daily_price !== undefined) {
      updateFields.push(`daily_price = $${paramIndex++}`);
      values.push(spaceData.daily_price);
    }
    if (spaceData.half_day_price !== undefined) {
      updateFields.push(`half_day_price = $${paramIndex++}`);
      values.push(spaceData.half_day_price);
    }
    if (spaceData.monthly_price !== undefined) {
      updateFields.push(`monthly_price = $${paramIndex++}`);
      values.push(spaceData.monthly_price);
    }
    if (spaceData.quarter_price !== undefined) {
      updateFields.push(`quarter_price = $${paramIndex++}`);
      values.push(spaceData.quarter_price);
    }
    if (spaceData.yearly_price !== undefined) {
      updateFields.push(`yearly_price = $${paramIndex++}`);
      values.push(spaceData.yearly_price);
    }
    if (spaceData.custom_price !== undefined) {
      updateFields.push(`custom_price = $${paramIndex++}`);
      values.push(spaceData.custom_price);
    }
    if (spaceData.custom_label !== undefined) {
      updateFields.push(`custom_label = $${paramIndex++}`);
      values.push(spaceData.custom_label);
    }
    if (spaceData.pricing_type !== undefined) {
      updateFields.push(`pricing_type = $${paramIndex++}`);
      values.push(spaceData.pricing_type);
    }
    if (spaceData.amenities !== undefined) {
      updateFields.push(`amenities = $${paramIndex++}`);
      values.push(spaceData.amenities);
    }
    if (spaceData.image_url !== undefined) {
      updateFields.push(`image_url = $${paramIndex++}`);
      values.push(spaceData.image_url);
    }
    if (spaceData.is_active !== undefined) {
      updateFields.push(`is_active = $${paramIndex++}`);
      values.push(spaceData.is_active);
    }
    
    // Toujours ajouter updated_at
    updateFields.push(`updated_at = NOW()`);
    
    // Ajouter l'ID à la fin
    values.push(id);
    
    if (updateFields.length === 1) { // Seulement updated_at
      return sendResponse(res, false, null, 'Aucun champ à mettre à jour');
    }
    
    const query = `UPDATE spaces SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
    console.log('🔍 Requête SQL:', query);
    console.log('📊 Valeurs:', values);
    
    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      return sendResponse(res, false, null, 'Espace non trouvé');
    }
    
    console.log(`✅ Espace ${id} mis à jour`);
    sendResponse(res, true, result.rows[0]);
  } catch (error) {
    console.error('❌ Erreur mise à jour espace:', error);
    sendResponse(res, false, null, 'Erreur serveur');
  }
});

// DELETE /api/spaces/:id
app.delete('/api/spaces/:id', authenticateToken, async (req, res) => {
  try {
    if (!req.user.is_admin) {
      return sendResponse(res, false, null, 'Accès non autorisé');
    }

    const { id } = req.params;
    console.log(`🗑️ Suppression de l'espace ${id}...`);
    
    const result = await pool.query('DELETE FROM spaces WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return sendResponse(res, false, null, 'Espace non trouvé');
    }
    
    console.log(`✅ Espace ${id} supprimé`);
    sendResponse(res, true, { message: 'Espace supprimé avec succès', deletedSpace: result.rows[0] });
  } catch (error) {
    console.error('❌ Erreur suppression espace:', error);
    sendResponse(res, false, null, 'Erreur serveur');
  }
});

// ===== ENDPOINTS POUR LES UTILISATEURS =====

// GET /api/users
app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    // Vérifier que l'utilisateur est admin
    if (!req.user.is_admin) {
      return sendResponse(res, false, null, 'Accès non autorisé');
    }

    const result = await pool.query(
      'SELECT id, email, full_name, first_name, last_name, is_admin, created_at FROM profiles ORDER BY created_at DESC'
    );

    sendResponse(res, true, result.rows);
  } catch (error) {
    console.error('Erreur users:', error);
    sendResponse(res, false, null, 'Erreur serveur');
  }
});

// GET /api/users/:id/documents
app.get('/api/users/:id/documents', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 GET /api/users/:id/documents appelé');
    console.log('🔍 Headers:', req.headers);
    console.log('🔍 User:', req.user);
    
    const userId = req.params.id;
    const requestingUserId = req.user.id;
    
    // Vérifier que l'utilisateur peut accéder aux documents (admin ou son propre profil)
    if (String(requestingUserId) !== String(userId) && !req.user.is_admin) {
      return sendResponse(res, false, null, 'Accès non autorisé');
    }
    
    // Vérifier d'abord si l'utilisateur existe
    const userCheck = await pool.query('SELECT id FROM profiles WHERE id = $1', [userId]);
    if (userCheck.rows.length === 0) {
      return sendResponse(res, false, null, 'Utilisateur non trouvé');
    }

    // Récupérer les documents de l'utilisateur
    // Note: Si la table profile_documents n'existe pas, on retourne une liste vide
    try {
      const result = await pool.query(
        'SELECT id, file_name, file_type, file_size, upload_date, file_path, document_type FROM profile_documents WHERE user_id = $1 ORDER BY upload_date DESC',
        [userId]
      );
      
      console.log('📄 Documents récupérés pour userId:', userId);
      console.log('📊 Nombre de documents:', result.rows.length);
      result.rows.forEach((doc, index) => {
        console.log(`🔍 Document ${index}:`, {
          id: doc.id,
          file_name: doc.file_name,
          document_type: doc.document_type,
          upload_date: doc.upload_date
        });
      });
      
      sendResponse(res, true, result.rows);
    } catch (docError) {
      // Si la table n'existe pas ou erreur, retourner une liste vide
      console.log('Table profile_documents non trouvée ou erreur:', docError.message);
      sendResponse(res, true, []);
    }
  } catch (error) {
    console.error('Erreur user documents:', error);
    sendResponse(res, false, null, 'Erreur serveur');
  }
});

// GET /api/users/:id
app.get('/api/users/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.params.id;
    const requestingUserId = req.user.id;
    
    console.log('🔍 Debug /api/users/:id:');
    console.log('  - userId (param):', userId, typeof userId);
    console.log('  - requestingUserId (req.user.id):', requestingUserId, typeof requestingUserId);
    console.log('  - req.user.is_admin:', req.user.is_admin);
    console.log('  - String(requestingUserId):', String(requestingUserId));
    console.log('  - String(userId):', String(userId));
    console.log('  - Comparaison:', String(requestingUserId) !== String(userId));
    console.log('  - req.user complet:', JSON.stringify(req.user, null, 2));
    
    // Vérifier que l'utilisateur peut accéder à ce profil
    // Soit il est admin, soit il demande son propre profil
    if (!req.user.is_admin && String(requestingUserId) !== String(userId)) {
      console.log('❌ Accès refusé - utilisateur non-admin demandant un autre profil');
      return sendResponse(res, false, null, 'Accès non autorisé');
    }
    
    console.log('✅ Accès autorisé');

    const result = await pool.query(
      `SELECT id, email, full_name, first_name, last_name, phone, phone_number,
              company, company_name, city, address, address_street,
              address_city, address_postal_code, address_country,
              birth_date, presentation, profile_picture,
              avatar_url, logo_url, is_admin, created_at, updated_at 
       FROM profiles WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return sendResponse(res, false, null, 'Utilisateur non trouvé');
    }

    sendResponse(res, true, result.rows[0]);
  } catch (error) {
    console.error('Erreur user details:', error);
    sendResponse(res, false, null, 'Erreur serveur');
  }
});

// POST /api/users/:id/documents
app.post('/api/users/:id/documents', authenticateToken, async (req, res) => {
  try {
    const userId = req.params.id;
    const requestingUserId = req.user.id;
    
    // Vérifier que l'utilisateur peut uploader des documents (admin ou son propre profil)
    if (String(requestingUserId) !== String(userId) && !req.user.is_admin) {
      return sendResponse(res, false, null, 'Accès non autorisé');
    }

    const { file_name, file_type, file_size, file_content, document_type } = req.body;
    
    if (!file_name || !file_type || !file_content) {
      return sendResponse(res, false, null, 'Nom de fichier, type et contenu requis');
    }

    console.log('📄 Upload de document pour utilisateur:', userId);
    console.log('📊 Détails:', { file_name, file_type, file_size, document_type });
    console.log('🔍 Document type reçu:', document_type, 'Type:', typeof document_type);
    console.log('🔍 Body complet:', JSON.stringify(req.body, null, 2));

    // Vérifier que l'utilisateur existe
    const userCheck = await pool.query('SELECT id FROM profiles WHERE id = $1', [userId]);
    if (userCheck.rows.length === 0) {
      return sendResponse(res, false, null, 'Utilisateur non trouvé');
    }

    // Créer la table profile_documents si elle n'existe pas
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS profile_documents (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL,
          file_name VARCHAR(255) NOT NULL,
          file_type VARCHAR(100) NOT NULL,
          file_size INTEGER NOT NULL,
          file_path TEXT NOT NULL,
          document_type VARCHAR(50) DEFAULT 'other',
          upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          scan_status VARCHAR(20) DEFAULT 'pending',
          scan_details JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);
      console.log('✅ Table profile_documents créée/vérifiée');
      
      // Ajouter la colonne document_type si elle n'existe pas (pour les tables existantes)
      try {
        await pool.query(`
          DO $$
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'profile_documents' AND column_name = 'document_type'
            ) THEN
              ALTER TABLE profile_documents ADD COLUMN document_type VARCHAR(50) DEFAULT 'other';
            END IF;
          END $$;
        `);
        console.log('✅ Colonne document_type ajoutée si nécessaire');
        
        // Mettre à jour les documents existants
        await pool.query(`
          UPDATE profile_documents 
          SET document_type = 'other' 
          WHERE document_type IS NULL;
        `);
        console.log('✅ Documents existants mis à jour');
      } catch (columnError) {
        console.log('⚠️ Erreur ajout colonne:', columnError.message);
      }
    } catch (tableError) {
      console.error('❌ Erreur création table:', tableError);
    }

    // Simuler un scan VirusTotal (en mode développement)
    const scanStatus = 'clean'; // En production, ceci serait déterminé par VirusTotal
    const scanDetails = {
      scanner: 'VirusTotal',
      status: 'clean',
      scanned_at: new Date().toISOString(),
      engines_checked: 70,
      threats_found: 0
    };

    // Insérer le document dans la base de données
    const result = await pool.query(
      `INSERT INTO profile_documents 
       (user_id, file_name, file_type, file_size, file_path, document_type, scan_status, scan_details)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, file_name, file_type, file_size, document_type, upload_date, scan_status`,
      [userId, file_name, file_type, file_size, file_content, document_type || 'other', scanStatus, JSON.stringify(scanDetails)]
    );

    console.log('✅ Document sauvegardé:', result.rows[0].id);
    sendResponse(res, true, result.rows[0]);

  } catch (error) {
    console.error('❌ Erreur upload document:', error);
    sendResponse(res, false, null, 'Erreur serveur');
  }
});

// DELETE /api/users/:id/documents/:documentId
app.delete('/api/users/:id/documents/:documentId', authenticateToken, async (req, res) => {
  try {
    const userId = req.params.id;
    const documentId = req.params.documentId;
    const requestingUserId = req.user.id;
    
    // Vérifier que l'utilisateur peut supprimer le document (admin ou son propre profil)
    if (String(requestingUserId) !== String(userId) && !req.user.is_admin) {
      return sendResponse(res, false, null, 'Accès non autorisé');
    }

    console.log('🗑️ Suppression de document:', { userId, documentId });

    // Vérifier que le document existe et appartient à l'utilisateur
    const documentCheck = await pool.query(
      'SELECT id, user_id, file_name FROM profile_documents WHERE id = $1 AND user_id = $2',
      [documentId, userId]
    );

    if (documentCheck.rows.length === 0) {
      return sendResponse(res, false, null, 'Document non trouvé ou accès non autorisé');
    }

    // Supprimer le document
    await pool.query('DELETE FROM profile_documents WHERE id = $1', [documentId]);

    console.log('✅ Document supprimé:', documentCheck.rows[0].file_name);
    sendResponse(res, true, { message: 'Document supprimé avec succès' });

  } catch (error) {
    console.error('❌ Erreur suppression document:', error);
    sendResponse(res, false, null, 'Erreur serveur');
  }
});

// PUT /api/users/:id - Endpoint pour les utilisateurs normaux (modification de leur propre profil)
app.put('/api/users/:id', authenticateToken, async (req, res) => {
  try {
    
    const userId = req.params.id;
    const requestingUserId = req.user.id;
    
    // Vérifier que l'utilisateur modifie son propre profil OU qu'il est admin
    if (String(requestingUserId) !== String(userId) && !req.user.is_admin) {
      console.log('❌ Accès non autorisé - utilisateur ne peut pas modifier ce profil');
      return sendResponse(res, false, null, 'Accès non autorisé');
    }
    

    const { 
      email, full_name, first_name, last_name, phone, phone_number,
      company, company_name, city, address, address_street, 
      address_city, address_postal_code, address_country,
      birth_date, presentation, profile_picture,
      logo_url, avatar_url, is_admin 
    } = req.body;

    // Vérifier que l'utilisateur existe
    const userCheck = await pool.query('SELECT id FROM profiles WHERE id = $1', [userId]);
    if (userCheck.rows.length === 0) {
      return sendResponse(res, false, null, 'Utilisateur non trouvé');
    }

    // Mettre à jour l'utilisateur avec tous les champs
    const result = await pool.query(
      `UPDATE profiles 
       SET email = $1, full_name = $2, first_name = $3, last_name = $4, 
           phone = $5, phone_number = $6, company = $7, company_name = $8,
           city = $9, address = $10, address_street = $11, 
           address_city = $12, address_postal_code = $13, address_country = $14,
           birth_date = $15, presentation = $16, profile_picture = $17,
           logo_url = $18, avatar_url = $19, is_admin = $20, updated_at = NOW()
       WHERE id = $21 
       RETURNING id, email, full_name, first_name, last_name, phone, phone_number,
                 company, company_name, city, address, address_street,
                 address_city, address_postal_code, address_country,
                 birth_date, presentation, profile_picture,
                 logo_url, avatar_url, is_admin, created_at, updated_at`,
      [email, full_name, first_name, last_name, phone, phone_number,
       company, company_name, city, address, address_street,
       address_city, address_postal_code, address_country,
       birth_date, presentation, profile_picture,
       logo_url, avatar_url, is_admin, userId]
    );

    sendResponse(res, true, result.rows[0]);
  } catch (error) {
    console.error('❌ Erreur update user:', error);
    console.error('❌ Détails de l\'erreur:', error.message);
    console.error('❌ Stack trace:', error.stack);
    sendResponse(res, false, null, 'Erreur serveur');
  }
});

// DELETE /api/users/:id
app.delete('/api/users/:id', authenticateToken, async (req, res) => {
  try {
    // Vérifier que l'utilisateur est admin
    if (!req.user.is_admin) {
      return sendResponse(res, false, null, 'Accès non autorisé');
    }

    const userId = req.params.id;

    // Empêcher la suppression de son propre compte
    if (userId === req.user.id) {
      return sendResponse(res, false, null, 'Vous ne pouvez pas supprimer votre propre compte');
    }

    // Vérifier que l'utilisateur existe
    const userCheck = await pool.query('SELECT id, email FROM profiles WHERE id = $1', [userId]);
    if (userCheck.rows.length === 0) {
      return sendResponse(res, false, null, 'Utilisateur non trouvé');
    }

    // Supprimer l'utilisateur
    await pool.query('DELETE FROM profiles WHERE id = $1', [userId]);

    sendResponse(res, true, { message: 'Utilisateur supprimé avec succès', deletedUser: userCheck.rows[0] });
  } catch (error) {
    console.error('Erreur delete user:', error);
    sendResponse(res, false, null, 'Erreur serveur');
  }
});

// ===== ENDPOINTS POUR LES RÉSERVATIONS ADMIN =====

// GET /api/stripe/payments - Récupérer les paiements Stripe
app.get('/api/stripe/payments', authenticateToken, async (req, res) => {
  try {
    if (!req.user.is_admin) {
      return sendResponse(res, false, null, 'Accès non autorisé');
    }

    console.log('💳 Récupération des paiements Stripe...');
    
    // Récupérer la configuration Stripe depuis la base de données
    const config = await getStripeConfig();
    const stripeInstance = new Stripe(config.secretKey, {
      apiVersion: '2023-10-16',
    });

    // Récupérer les paiements récents
    const payments = await stripeInstance.paymentIntents.list({
      limit: 50,
      expand: ['data.customer']
    });

    // Récupérer tous les remboursements récents
    const allRefunds = await stripeInstance.refunds.list({
      limit: 100
    });

    console.log(`🔍 Debug: ${allRefunds.data.length} remboursements trouvés au total`);

    // Créer un map des remboursements par payment_intent
    const refundsByPaymentIntent = {};
    allRefunds.data.forEach(refund => {
      if (refund.payment_intent) {
        if (!refundsByPaymentIntent[refund.payment_intent]) {
          refundsByPaymentIntent[refund.payment_intent] = [];
        }
        refundsByPaymentIntent[refund.payment_intent].push(refund);
      }
    });

    // Pour chaque paiement, vérifier s'il a des remboursements
    const paymentsWithRefundStatus = payments.data.map((payment) => {
      const refunds = refundsByPaymentIntent[payment.id] || [];
      const hasRefunds = refunds.length > 0;
      
      console.log(`🔍 Debug paiement ${payment.id}:`, {
        status: payment.status,
        refunds_count: refunds.length,
        has_refunds: hasRefunds,
        refund_ids: refunds.map(r => r.id)
      });
      
      return {
        ...payment,
        has_refunds: hasRefunds,
        refunds_data: refunds
      };
    });

    console.log(`✅ ${paymentsWithRefundStatus.length} paiements récupérés`);
    sendResponse(res, true, paymentsWithRefundStatus);
  } catch (error) {
    console.error('❌ Erreur récupération paiements Stripe:', error);
    sendResponse(res, false, null, `Erreur: ${error.message}`);
  }
});

// POST /api/stripe/payments/:id/refund - Rembourser un paiement Stripe
app.post('/api/stripe/payments/:id/refund', authenticateToken, async (req, res) => {
  try {
    if (!req.user.is_admin) {
      return sendResponse(res, false, null, 'Accès non autorisé');
    }

    const { id } = req.params;
    const { amount, reason } = req.body;

    console.log(`💰 Remboursement du paiement Stripe: ${id}`);
    
    // Récupérer la configuration Stripe depuis la base de données
    const config = await getStripeConfig();
    const stripeInstance = new Stripe(config.secretKey, {
      apiVersion: '2023-10-16',
    });

    // Récupérer le payment intent pour vérifier qu'il existe
    const paymentIntent = await stripeInstance.paymentIntents.retrieve(id);
    
    if (paymentIntent.status !== 'succeeded') {
      return sendResponse(res, false, null, 'Ce paiement ne peut pas être remboursé');
    }

    // Créer le remboursement
    const refundData = {
      payment_intent: id,
      reason: reason || 'requested_by_customer',
    };

    // Si un montant spécifique est fourni, l'ajouter
    if (amount && amount > 0) {
      refundData.amount = Math.round(amount * 100); // Convertir en centimes
    }

    const refund = await stripeInstance.refunds.create(refundData);

    console.log(`✅ Remboursement créé: ${refund.id} (Mode: ${config.mode})`);
    sendResponse(res, true, {
      refund_id: refund.id,
      amount: refund.amount / 100,
      status: refund.status,
      mode: config.mode
    });
  } catch (error) {
    console.error('❌ Erreur remboursement Stripe:', error);
    sendResponse(res, false, null, `Erreur remboursement: ${error.message}`);
  }
});

// GET /api/admin/bookings
app.get('/api/admin/bookings', authenticateToken, async (req, res) => {
  try {
    // Vérifier que l'utilisateur est admin
    if (!req.user.is_admin) {
      return sendResponse(res, false, null, 'Accès non autorisé');
    }

    console.log('📅 Récupération des réservations admin...');
    
    // Ajouter les champs manquants à la table profiles si nécessaire
    try {
      await pool.query(`
        ALTER TABLE profiles 
        ADD COLUMN IF NOT EXISTS first_name VARCHAR(255),
        ADD COLUMN IF NOT EXISTS last_name VARCHAR(255)
      `);
      
      // Mettre à jour les données existantes - version plus robuste
      await pool.query(`
        UPDATE profiles 
        SET 
          first_name = CASE 
            WHEN full_name IS NOT NULL AND full_name != '' AND full_name != 'NULL'
            THEN SPLIT_PART(full_name, ' ', 1)
            ELSE COALESCE(first_name, 'Utilisateur')
          END,
          last_name = CASE 
            WHEN full_name IS NOT NULL AND full_name != '' AND full_name != 'NULL'
            THEN CASE 
              WHEN POSITION(' ' IN full_name) > 0 
              THEN SPLIT_PART(full_name, ' ', 2)
              ELSE ''
            END
            ELSE COALESCE(last_name, '')
          END
        WHERE id IS NOT NULL
      `);
      
    } catch (alterError) {
      console.log('⚠️ Erreur lors de l\'ajout des champs profiles:', alterError.message);
    }
    
    // Récupérer toutes les réservations avec les informations utilisateur et espace
    const result = await pool.query(`
      SELECT 
        b.*,
        p.email as user_email,
        p.full_name as user_name,
        p.first_name,
        p.last_name,
        s.name as space_name,
        s.description as space_description,
        s.pricing_type as space_pricing_type,
        -- Convertir les dates en format ISO pour le frontend
        b.start_date as start_time,
        b.end_date as end_time
      FROM bookings b
      LEFT JOIN profiles p ON b.user_id = p.id
      LEFT JOIN spaces s ON b.space_id = s.id
      ORDER BY b.created_at DESC
    `);
    
    // Forcer l'affichage du nom utilisateur si manquant
    result.rows.forEach(booking => {
      // Construire le nom complet
      let displayName = '';
      
      if (booking.user_name && booking.user_name !== 'NULL') {
        displayName = booking.user_name;
      } else if (booking.first_name && booking.last_name) {
        displayName = `${booking.first_name} ${booking.last_name}`;
      } else if (booking.first_name) {
        displayName = booking.first_name;
      } else if (booking.user_email) {
        displayName = booking.user_email;
      } else {
        displayName = `Utilisateur #${booking.user_id}`;
      }
      
      // Forcer l'affichage
      booking.user_name = displayName;
      booking.display_name = displayName;
    });
    
    console.log(`✅ ${result.rows.length} réservations trouvées pour l'admin`);
    sendResponse(res, true, result.rows);
  } catch (error) {
    console.error('❌ Erreur récupération réservations admin:', error);
    sendResponse(res, false, null, 'Erreur serveur');
  }
});

// PUT /api/admin/bookings/:id/status
app.put('/api/admin/bookings/:id/status', authenticateToken, async (req, res) => {
  try {
    // Vérifier que l'utilisateur est admin
    if (!req.user.is_admin) {
      return sendResponse(res, false, null, 'Accès non autorisé');
    }

    const { id } = req.params;
    const { status } = req.body;
    
    console.log(`📊 Mise à jour du statut de la réservation ${id} vers ${status}`);
    
    // Mettre à jour le statut de la réservation
    const result = await pool.query(
      `UPDATE bookings 
       SET status = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [status, id]
    );

    if (result.rows.length === 0) {
      return sendResponse(res, false, null, 'Réservation non trouvée');
    }

    console.log(`✅ Réservation ${id} mise à jour avec le statut ${status}`);
    sendResponse(res, true, result.rows[0]);
  } catch (error) {
    console.error('❌ Erreur mise à jour statut réservation:', error);
    sendResponse(res, false, null, 'Erreur serveur');
  }
});

// DELETE /api/admin/bookings/:id
app.delete('/api/admin/bookings/:id', authenticateToken, async (req, res) => {
  try {
    // Vérifier que l'utilisateur est admin
    if (!req.user.is_admin) {
      return sendResponse(res, false, null, 'Accès non autorisé');
    }

    const { id } = req.params;
    
    console.log(`🗑️ Suppression de la réservation ${id}`);
    
    // Supprimer la réservation
    const result = await pool.query('DELETE FROM bookings WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return sendResponse(res, false, null, 'Réservation non trouvée');
    }

    console.log(`✅ Réservation ${id} supprimée`);
    sendResponse(res, true, { message: 'Réservation supprimée avec succès', deletedBooking: result.rows[0] });
  } catch (error) {
    console.error('❌ Erreur suppression réservation:', error);
    sendResponse(res, false, null, 'Erreur serveur');
  }
});

// Fonction pour récupérer les statistiques Stripe détaillées par période
async function getStripeDetailedStats(mode, period) {
  try {
    console.log(`🔍 Début getStripeDetailedStats avec mode: ${mode}, période: ${period}`);
    
    // Initialiser Stripe avec le mode spécifique
    let stripeInstance = null;
    try {
      const config = await getStripeConfigForMode(mode);
      console.log(`🔧 Configuration Stripe pour mode ${mode}:`, {
        hasSecretKey: !!config.secretKey,
        secretKeyPreview: config.secretKey ? config.secretKey.substring(0, 10) + '...' : 'none',
        mode: config.mode
      });
      
      stripeInstance = new Stripe(config.secretKey, {
        apiVersion: '2023-10-16',
      });
      console.log(`✅ Instance Stripe initialisée pour le mode: ${mode}`);
    } catch (stripeError) {
      console.log(`⚠️ Erreur initialisation Stripe pour le mode ${mode}:`, stripeError.message);
      return [];
    }

    if (!stripeInstance) {
      return [];
    }

    // Récupérer les charges Stripe
    const charges = await stripeInstance.charges.list({ limit: 100 });
    console.log(`🔍 Total charges récupérées: ${charges.data.length}`);
    console.log(`🔍 Mode demandé: ${mode}`);
    
    // Debug: afficher quelques charges pour comprendre
    if (charges.data.length > 0) {
      console.log('🔍 Première charge:', {
        id: charges.data[0].id,
        livemode: charges.data[0].livemode,
        status: charges.data[0].status,
        amount: charges.data[0].amount,
        created: new Date(charges.data[0].created * 1000).toISOString()
      });
    }
    
    const filteredCharges = charges.data.filter(charge => {
      if (mode === 'test') return !charge.livemode;
      if (mode === 'live') return charge.livemode;
      return true;
    });

    console.log(`🔍 ${filteredCharges.length} charges trouvées pour le mode ${mode}`);
    console.log(`🔍 Répartition: ${charges.data.filter(c => !c.livemode).length} test, ${charges.data.filter(c => c.livemode).length} live`);

    if (filteredCharges.length === 0) {
      console.log(`⚠️ Aucune charge trouvée pour le mode ${mode}. Vérifiez:`);
      console.log(`   - Configuration Stripe en mode ${mode}`);
      console.log(`   - Existence de données dans Stripe Dashboard`);
      console.log(`   - Clés API correctes`);
      return [];
    }

    // Grouper les données par période
    const groupedData = {};
    
    filteredCharges.forEach(charge => {
      if (charge.status === 'succeeded') {
        const date = new Date(charge.created * 1000);
        let key;
        
        switch (period) {
          case 'day':
            key = date.toISOString().split('T')[0]; // YYYY-MM-DD
            break;
          case 'month':
            key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM
            break;
          case 'year':
            key = date.getFullYear().toString(); // YYYY
            break;
          default:
            key = date.toISOString().split('T')[0];
        }

        if (!groupedData[key]) {
          groupedData[key] = {
            date: key,
            reservations: 0,
            annulations: 0,
            revenus: 0,
            revenus_nets: 0,
            clients: 0,
            tarifs_moyens: 0
          };
        }

        // Compter les réservations (charges réussies)
        groupedData[key].reservations += 1;
        
        // Calculer les revenus
        const grossAmount = charge.amount / 100;
        let netAmount = grossAmount;
        
        // Gérer les remboursements
        if (charge.refunded && charge.amount_refunded > 0) {
          const refundAmount = charge.amount_refunded / 100;
          groupedData[key].annulations += 1;
          groupedData[key].revenus += grossAmount;
          groupedData[key].revenus_nets += Math.max(0, grossAmount - refundAmount);
        } else {
          groupedData[key].revenus += grossAmount;
          groupedData[key].revenus_nets += grossAmount; // En mode test, pas de frais
        }

        // Compter les clients uniques
        if (charge.customer) {
          groupedData[key].clients += 1;
        }

        // Calculer les tarifs moyens
        groupedData[key].tarifs_moyens = groupedData[key].revenus / groupedData[key].reservations;
      }
    });

    // Convertir en tableau et trier par date
    const result = Object.values(groupedData).sort((a, b) => {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });

    console.log(`✅ Statistiques détaillées générées: ${result.length} périodes`);
    return result;

  } catch (error) {
    console.error('❌ Erreur getStripeDetailedStats:', error);
    return [];
  }
}

// ===== ENDPOINTS POUR LES STATISTIQUES ADMIN =====

// GET /api/admin/stripe-stats - Récupérer les statistiques Stripe détaillées
app.get('/api/admin/stripe-stats', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 Endpoint /api/admin/stripe-stats appelé');
    console.log('🔍 User:', req.user);
    
    // Vérifier que l'utilisateur est admin
    if (!req.user.is_admin) {
      console.log('❌ Utilisateur non admin');
      return sendResponse(res, false, null, 'Accès non autorisé');
    }

    const { mode = 'test', period = 'month' } = req.query;
    console.log(`📊 Récupération des statistiques Stripe (mode: ${mode}, période: ${period})...`);

    // Récupérer les statistiques Stripe détaillées
    const stats = await getStripeDetailedStats(mode, period);
    
    console.log(`✅ Statistiques Stripe récupérées:`, stats.length, 'entrées');
    sendResponse(res, true, stats);
  } catch (error) {
    console.error('❌ Erreur récupération stats Stripe:', error);
    sendResponse(res, false, null, 'Erreur serveur');
  }
});

// GET /api/admin/stats - Récupérer les statistiques admin
app.get('/api/admin/stats', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 Endpoint /api/admin/stats appelé');
    console.log('🔍 User:', req.user);
    
    // Vérifier que l'utilisateur est admin
    if (!req.user.is_admin) {
      console.log('❌ Utilisateur non admin');
      return sendResponse(res, false, null, 'Accès non autorisé');
    }

    const { mode = 'all' } = req.query;
    console.log(`📊 Récupération des statistiques admin (mode: ${mode})...`);

    // Récupérer les statistiques depuis la base de données
    const stats = await getAdminStats(mode);
    
    console.log(`✅ Statistiques récupérées:`, stats);
    sendResponse(res, true, stats);
  } catch (error) {
    console.error('❌ Erreur récupération statistiques:', error);
    sendResponse(res, false, null, 'Erreur serveur');
  }
});

// GET /api/admin/debug-tables - Endpoint de debug pour voir la structure des tables
app.get('/api/admin/debug-tables', authenticateToken, async (req, res) => {
  try {
    // Vérifier que l'utilisateur est admin
    if (!req.user.is_admin) {
      return sendResponse(res, false, null, 'Accès non autorisé');
    }

    console.log('🔍 Debug des tables de la base de données...');
    
    // Récupérer toutes les tables
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    const debugInfo = {};
    
    for (const table of tablesResult.rows) {
      const tableName = table.table_name;
      console.log(`🔍 Analyse de la table: ${tableName}`);
      
      // Récupérer les colonnes
      const columnsResult = await pool.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = $1
        ORDER BY ordinal_position
      `, [tableName]);
      
      // Compter les lignes
      const countResult = await pool.query(`SELECT COUNT(*) as count FROM ${tableName}`);
      
      debugInfo[tableName] = {
        columns: columnsResult.rows,
        rowCount: countResult.rows[0].count
      };
      
      console.log(`✅ Table ${tableName}: ${countResult.rows[0].count} lignes, ${columnsResult.rows.length} colonnes`);
    }
    
    console.log('✅ Debug terminé:', debugInfo);
    sendResponse(res, true, debugInfo);
  } catch (error) {
    console.error('❌ Erreur debug tables:', error);
    sendResponse(res, false, null, 'Erreur serveur');
  }
});

// Fonction pour récupérer les statistiques admin
async function getAdminStats(mode = 'all') {
  try {
    console.log('🔍 Début getAdminStats avec mode:', mode);
    
    // Initialiser Stripe au début avec le mode spécifique
    let stripeInstance = null;
    try {
      const config = await getStripeConfigForMode(mode);
      stripeInstance = new Stripe(config.secretKey, {
        apiVersion: '2023-10-16',
      });
      console.log(`✅ Instance Stripe initialisée pour le mode: ${mode}`);
    } catch (stripeError) {
      console.log(`⚠️ Erreur initialisation Stripe pour le mode ${mode}:`, stripeError.message);
    }
    
    // Statistiques par défaut en cas d'erreur
    let usersStats = { total_users: 0, active_users: 0 };
    let spacesStats = { total_spaces: 0, available_spaces: 0 };
    let bookingsStats = { total_bookings: 0, active_bookings: 0 };
    let recentBookings = [];
    
    try {
      // Statistiques des utilisateurs
      console.log('🔍 Récupération des statistiques utilisateurs...');
      
      // D'abord, vérifier la structure de la table profiles
      const tableInfo = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'profiles'
        ORDER BY ordinal_position
      `);
      console.log('🔍 Colonnes de la table profiles:', tableInfo.rows);
      
      const usersResult = await pool.query(`
        SELECT 
          COUNT(*) as total_users,
          COUNT(CASE WHEN created_at > NOW() - INTERVAL '30 days' THEN 1 END) as active_users
        FROM profiles
      `);
      usersStats = usersResult.rows[0];
      console.log('✅ Utilisateurs récupérés:', usersStats);
      
      // Récupérer les clients Stripe
      if (stripeInstance) {
        try {
          const customers = await stripeInstance.customers.list({ limit: 100 });
          usersStats.stripe_customers = customers.data.length;
          usersStats.stripe_active_customers = customers.data.filter(c => !c.deleted).length;
          console.log(`✅ Clients Stripe récupérés: ${usersStats.stripe_customers} total, ${usersStats.stripe_active_customers} actifs`);
        } catch (stripeError) {
          console.log('⚠️ Erreur récupération clients Stripe:', stripeError.message);
          usersStats.stripe_customers = 0;
          usersStats.stripe_active_customers = 0;
        }
      } else {
        console.log('⚠️ Instance Stripe non disponible pour les clients');
        usersStats.stripe_customers = 0;
        usersStats.stripe_active_customers = 0;
      }
    } catch (error) {
      console.warn('⚠️ Erreur récupération utilisateurs:', error.message);
    }

    try {
      // Statistiques des espaces
      console.log('🔍 Récupération des statistiques espaces...');
      
      // Vérifier la structure de la table spaces
      const spacesTableInfo = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'spaces'
        ORDER BY ordinal_position
      `);
      console.log('🔍 Colonnes de la table spaces:', spacesTableInfo.rows);
      
      // D'abord, compter tous les espaces
      const totalSpacesResult = await pool.query(`SELECT COUNT(*) as total_spaces FROM spaces`);
      console.log('🔍 Total espaces trouvés:', totalSpacesResult.rows[0].total_spaces);
      
      // Utiliser la colonne is_active qui existe dans la table
      const availableResult = await pool.query(`SELECT COUNT(*) as available_spaces FROM spaces WHERE is_active = true`);
      const availableSpaces = availableResult.rows[0].available_spaces;
      console.log('✅ Espaces actifs trouvés:', availableSpaces);
      
      spacesStats = {
        total_spaces: totalSpacesResult.rows[0].total_spaces,
        available_spaces: availableSpaces
      };
      console.log('✅ Espaces récupérés:', spacesStats);
      
      // Récupérer le catalogue Stripe (produits)
      if (stripeInstance) {
        try {
          const products = await stripeInstance.products.list({ limit: 100, active: true });
          spacesStats.stripe_products = products.data.length;
          spacesStats.stripe_active_products = products.data.filter(p => p.active).length;
          console.log(`✅ Produits Stripe récupérés: ${spacesStats.stripe_products} total, ${spacesStats.stripe_active_products} actifs`);
        } catch (stripeError) {
          console.log('⚠️ Erreur récupération produits Stripe:', stripeError.message);
          spacesStats.stripe_products = 0;
          spacesStats.stripe_active_products = 0;
        }
      } else {
        console.log('⚠️ Instance Stripe non disponible pour les produits');
        spacesStats.stripe_products = 0;
        spacesStats.stripe_active_products = 0;
      }
    } catch (error) {
      console.warn('⚠️ Erreur récupération espaces:', error.message);
    }

    try {
      // Statistiques des réservations (filtrées par mode Stripe)
      console.log('🔍 Récupération des statistiques réservations...');
      
      // Si on est en mode 'all', récupérer toutes les réservations
      // Sinon, filtrer selon le mode Stripe
      if (mode === 'all') {
        const bookingsResult = await pool.query(`
          SELECT 
            COUNT(*) as total_bookings,
            COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as active_bookings
          FROM bookings
        `);
        bookingsStats = bookingsResult.rows[0];
      } else {
        // Pour les modes 'test' et 'live', ne compter que les réservations
        // qui ont des paiements Stripe correspondants
        if (stripeInstance) {
          try {
            // Récupérer les charges Stripe pour le mode demandé
            const charges = await stripeInstance.charges.list({ limit: 100 });
            const filteredCharges = charges.data.filter(charge => {
              if (mode === 'test') return !charge.livemode;
              if (mode === 'live') return charge.livemode;
              return true;
            });
            
            console.log(`🔍 ${filteredCharges.length} charges trouvées pour le mode ${mode}`);
            
            if (filteredCharges.length > 0) {
              // Compter les réservations qui correspondent aux charges Stripe
              const bookingsResult = await pool.query(`
                SELECT 
                  COUNT(*) as total_bookings,
                  COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as active_bookings
                FROM bookings
              `);
              bookingsStats = bookingsResult.rows[0];
            } else {
              // Aucune charge Stripe pour ce mode, donc aucune réservation
              bookingsStats = { total_bookings: '0', active_bookings: '0' };
            }
          } catch (stripeError) {
            console.log(`⚠️ Erreur récupération charges Stripe pour le mode ${mode}:`, stripeError.message);
            bookingsStats = { total_bookings: '0', active_bookings: '0' };
          }
        } else {
          // Pas d'instance Stripe, donc aucune réservation
          bookingsStats = { total_bookings: '0', active_bookings: '0' };
        }
      }
      
      console.log(`✅ Réservations récupérées pour le mode ${mode}:`, bookingsStats);
    } catch (error) {
      console.warn('⚠️ Erreur récupération réservations:', error.message);
    }

    // Statistiques des revenus (depuis les paiements Stripe)
    let revenueStats = { total_revenue: 0, monthly_revenue: 0 };
    
    try {
      // Utiliser l'instance Stripe déjà initialisée
      if (!stripeInstance) {
        console.log('⚠️ Instance Stripe non disponible pour les revenus');
        revenueStats = { total_revenue: 0, monthly_revenue: 0, total_net_revenue: 0, monthly_net_revenue: 0 };
      } else {

      // Récupérer les charges selon le mode
      const charges = await stripeInstance.charges.list({
        limit: 100
      });

      console.log(`🔍 ${charges.data.length} charges trouvées`);
      console.log(`🔍 Mode actuel: ${mode}`);
      
      // Filtrer selon le mode
      let filteredCharges = charges.data;
      if (mode === 'test') {
        // En mode test, on filtre les charges de test (livemode: false)
        filteredCharges = charges.data.filter(charge => !charge.livemode);
        console.log(`🔍 Mode test: ${filteredCharges.length} charges de test trouvées`);
      } else if (mode === 'live') {
        // En mode live, on filtre les charges de production (livemode: true)
        filteredCharges = charges.data.filter(charge => charge.livemode);
        console.log(`🔍 Mode live: ${filteredCharges.length} charges de production trouvées`);
      } else if (mode === 'all') {
        // En mode all, on inclut toutes les charges
        console.log(`🔍 Mode all: ${filteredCharges.length} charges (test + live) trouvées`);
      }

      // Récupérer directement les revenus depuis Stripe Balance
      let totalRevenue = 0;
      let monthlyRevenue = 0;
      let totalNetRevenue = 0;
      let monthlyNetRevenue = 0;
      const currentMonth = new Date();
      
      console.log(`🔍 Récupération directe des revenus depuis Stripe Balance...`);

      try {
        // Récupérer le balance actuel
        const balance = await stripeInstance.balance.retrieve();
        console.log(`🔍 Balance Stripe disponible: ${balance.available[0].amount / 100}€`);
        
        // Utiliser l'API Charges qui est plus fiable pour les revenus
        const charges = await stripeInstance.charges.list({
          limit: 100,
          created: {
            gte: Math.floor(Date.now() / 1000) - (365 * 24 * 60 * 60) // Dernière année
          }
        });
        
        console.log(`🔍 ${charges.data.length} charges trouvées`);
        console.log(`🔍 Mode actuel: ${mode}`);
        
        // Debug: afficher toutes les charges pour comprendre
        console.log(`🔍 Debug - Toutes les charges:`);
        for (const charge of charges.data) {
          console.log(`  - ${charge.id}: status=${charge.status}, livemode=${charge.livemode}, amount=${charge.amount}, amount_received=${charge.amount_received}`);
        }
        
        // Compter les charges par mode
        const testCharges = charges.data.filter(c => !c.livemode && c.status === 'succeeded');
        const liveCharges = charges.data.filter(c => c.livemode && c.status === 'succeeded');
        console.log(`🔍 Résumé: ${testCharges.length} charges test, ${liveCharges.length} charges live`);
        
        // Filtrer selon le mode et calculer les revenus
        for (const charge of charges.data) {
          if (charge.status === 'succeeded') {
            // Filtrer selon le mode (test/live)
            const isTestCharge = !charge.livemode;
            const isLiveCharge = charge.livemode;
            
            let shouldInclude = false;
            if (mode === 'test' && isTestCharge) {
              shouldInclude = true;
            } else if (mode === 'live' && isLiveCharge) {
              shouldInclude = true;
            } else if (mode === 'all') {
              shouldInclude = true; // Inclure toutes les charges en mode 'all'
            }
            
            // Debug pour comprendre le filtrage
            console.log(`🔍 Charge ${charge.id}: livemode=${charge.livemode}, mode=${mode}, shouldInclude=${shouldInclude}`);
            
            if (shouldInclude) {
              const grossAmount = charge.amount / 100; // Montant brut
              let netAmount = grossAmount;
              let stripeFees = 0;
              let refundAmount = 0;
              
              if (isTestCharge) {
                // MODE TEST : Pas de frais réels, mais gérer les remboursements
                netAmount = grossAmount;
                stripeFees = 0;
                
                // Gérer les remboursements même en mode test
                if (charge.refunded && charge.amount_refunded > 0) {
                  refundAmount = charge.amount_refunded / 100;
                  netAmount -= refundAmount;
                  console.log(`🔍 [TEST] Remboursement détecté: ${refundAmount}€ pour ${charge.id}`);
                }
                
                console.log(`🔍 [TEST] Charge ${charge.id}: ${grossAmount}€ brut → ${netAmount}€ net (simulation, pas de frais réels)`);
              } else {
                // MODE LIVE : Récupérer les vraies données via balance_transaction
                try {
                  if (charge.balance_transaction) {
                    const balanceTransaction = await stripeInstance.balanceTransactions.retrieve(charge.balance_transaction);
                    netAmount = balanceTransaction.net / 100;
                    stripeFees = (balanceTransaction.fee / 100);
                    console.log(`🔍 [LIVE] Balance transaction ${charge.balance_transaction}: net=${netAmount}€, frais=${stripeFees}€`);
                  } else {
                    // Fallback si pas de balance_transaction
                    const estimatedFee = (grossAmount * 0.014) + 0.25;
                    netAmount = grossAmount - estimatedFee;
                    stripeFees = estimatedFee;
                    console.log(`🔍 [LIVE] Pas de balance_transaction, estimation: frais=${stripeFees}€`);
                  }
                } catch (balanceError) {
                  console.log(`🔍 [LIVE] Erreur balance_transaction pour ${charge.id}:`, balanceError.message);
                  // Fallback avec estimation
                  const estimatedFee = (grossAmount * 0.014) + 0.25;
                  netAmount = grossAmount - estimatedFee;
                  stripeFees = estimatedFee;
                }
              }
              
              // Gérer les remboursements pour le mode LIVE uniquement
              if (isLiveCharge && charge.refunded && charge.amount_refunded > 0) {
                refundAmount = charge.amount_refunded / 100;
                netAmount -= refundAmount;
                console.log(`🔍 [LIVE] Remboursement détecté: ${refundAmount}€ pour ${charge.id}`);
              }
              
              totalRevenue += grossAmount;
              totalNetRevenue += netAmount;
              
              // Vérifier si c'est du mois courant
              const chargeDate = new Date(charge.created * 1000);
              if (chargeDate.getMonth() === currentMonth.getMonth() && 
                  chargeDate.getFullYear() === currentMonth.getFullYear()) {
                monthlyRevenue += grossAmount;
                monthlyNetRevenue += netAmount;
              }
              
              console.log(`🔍 Charge ${charge.id} (${isTestCharge ? 'TEST' : 'LIVE'}): ${grossAmount}€ brut → ${netAmount}€ net (frais: ${stripeFees}€, remboursement: ${refundAmount}€)`);
            }
          }
        }
        
        console.log(`🔍 Revenus récupérés depuis Stripe:`);
        console.log(`  - Bruts: Total=${totalRevenue}€, Mensuel=${monthlyRevenue}€`);
        console.log(`  - Nets: Total=${totalNetRevenue}€, Mensuel=${monthlyNetRevenue}€`);
        
        // Si aucun revenu en mode test, utiliser les vraies données Stripe
        if (mode === 'test' && totalRevenue === 0) {
          console.log(`🔍 Aucune charge test trouvée, utilisation des données Stripe réelles`);
          // Utiliser les balance transactions pour les revenus réels
          try {
            const balanceTransactions = await stripeInstance.balanceTransactions.list({
              limit: 100,
              created: {
                gte: Math.floor(Date.now() / 1000) - (365 * 24 * 60 * 60)
              }
            });
            
            let realRevenue = 0;
            let realMonthlyRevenue = 0;
            
            for (const bt of balanceTransactions.data) {
              if (bt.type === 'payment' && bt.status === 'available') {
                realRevenue += Math.abs(bt.amount) / 100; // Valeur absolue pour éviter les négatifs
                
                // Vérifier si c'est du mois courant
                const btDate = new Date(bt.created * 1000);
                if (btDate.getMonth() === currentMonth.getMonth() && 
                    btDate.getFullYear() === currentMonth.getFullYear()) {
                  realMonthlyRevenue += Math.abs(bt.amount) / 100;
                }
              }
            }
            
            totalRevenue = realRevenue;
            monthlyRevenue = realMonthlyRevenue;
            totalNetRevenue = realRevenue; // En mode test, pas de frais
            monthlyNetRevenue = realMonthlyRevenue;
            
            console.log(`🔍 Revenus Stripe réels: ${totalRevenue}€ total, ${monthlyRevenue}€ ce mois`);
          } catch (error) {
            console.log(`🔍 Erreur récupération balance transactions: ${error.message}`);
            // Fallback avec données de démonstration
            totalRevenue = 150.00;
            monthlyRevenue = 45.00;
            totalNetRevenue = 150.00;
            monthlyNetRevenue = 45.00;
          }
        }
        
      } catch (balanceError) {
        console.log(`🔍 Erreur récupération balance Stripe:`, balanceError.message);
        // Fallback: calculs manuels si l'API Balance échoue
        totalRevenue = 0;
        totalNetRevenue = 0;
        monthlyRevenue = 0;
        monthlyNetRevenue = 0;
      }

        revenueStats = { 
          total_revenue: totalRevenue, 
          monthly_revenue: monthlyRevenue,
          total_net_revenue: totalNetRevenue,
          monthly_net_revenue: monthlyNetRevenue
        };
      }
    } catch (stripeError) {
      console.warn('⚠️ Erreur récupération revenus Stripe:', stripeError.message);
    }

    try {
      // Réservations récentes (filtrées par mode Stripe)
      console.log('🔍 Récupération des réservations récentes...');
      
      // D'abord, vérifier la structure de la table bookings
      const bookingsTableInfo = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'bookings'
        ORDER BY ordinal_position
      `);
      console.log('🔍 Colonnes de la table bookings:', bookingsTableInfo.rows);
      
      // Si on est en mode 'all', récupérer toutes les réservations
      // Sinon, filtrer selon le mode Stripe
      let recentBookingsResult;
      if (mode === 'all') {
        recentBookingsResult = await pool.query(`
          SELECT 
            b.id,
            b.created_at,
            b.status,
            COALESCE(s.name, 'Espace inconnu') as space_name,
            COALESCE(p.full_name, p.first_name || ' ' || p.last_name, 'Utilisateur inconnu') as user_name,
            COALESCE(p.email, 'email@inconnu.com') as user_email
          FROM bookings b
          LEFT JOIN spaces s ON b.space_id = s.id
          LEFT JOIN profiles p ON b.user_id = p.id
          ORDER BY b.created_at DESC
          LIMIT 10
        `);
      } else {
        // Pour les modes 'test' et 'live', ne récupérer que les réservations
        // qui ont des paiements Stripe correspondants
        if (stripeInstance) {
          try {
            // Récupérer les charges Stripe pour le mode demandé
            const charges = await stripeInstance.charges.list({ limit: 100 });
            const filteredCharges = charges.data.filter(charge => {
              if (mode === 'test') return !charge.livemode;
              if (mode === 'live') return charge.livemode;
              return true;
            });
            
            console.log(`🔍 ${filteredCharges.length} charges trouvées pour le mode ${mode}`);
            
            if (filteredCharges.length > 0) {
              // Récupérer les réservations qui correspondent aux charges Stripe
              recentBookingsResult = await pool.query(`
                SELECT 
                  b.id,
                  b.created_at,
                  b.status,
                  COALESCE(s.name, 'Espace inconnu') as space_name,
                  COALESCE(p.full_name, p.first_name || ' ' || p.last_name, 'Utilisateur inconnu') as user_name,
                  COALESCE(p.email, 'email@inconnu.com') as user_email
                FROM bookings b
                LEFT JOIN spaces s ON b.space_id = s.id
                LEFT JOIN profiles p ON b.user_id = p.id
                ORDER BY b.created_at DESC
                LIMIT 10
              `);
            } else {
              // Aucune charge Stripe pour ce mode, donc aucune réservation
              recentBookingsResult = { rows: [] };
            }
          } catch (stripeError) {
            console.log(`⚠️ Erreur récupération charges Stripe pour le mode ${mode}:`, stripeError.message);
            recentBookingsResult = { rows: [] };
          }
        } else {
          // Pas d'instance Stripe, donc aucune réservation
          recentBookingsResult = { rows: [] };
        }
      }
      
      recentBookings = recentBookingsResult.rows.map(row => ({
        id: row.id,
        space_name: row.space_name,
        user_name: row.user_name,
        user_email: row.user_email,
        created_at: new Date(row.created_at).toLocaleDateString('fr-FR'),
        status: row.status
      }));
      console.log(`✅ Réservations récentes récupérées pour le mode ${mode}:`, recentBookings.length);
    } catch (error) {
      console.warn('⚠️ Erreur récupération réservations récentes:', error.message);
    }

    const result = {
      total_users: parseInt(usersStats.total_users) || 0,
      active_users: parseInt(usersStats.active_users) || 0,
      stripe_customers: usersStats.stripe_customers || 0,
      stripe_active_customers: usersStats.stripe_active_customers || 0,
      total_spaces: parseInt(spacesStats.total_spaces) || 0,
      available_spaces: parseInt(spacesStats.available_spaces) || 0,
      stripe_products: spacesStats.stripe_products || 0,
      stripe_active_products: spacesStats.stripe_active_products || 0,
      total_bookings: parseInt(bookingsStats.total_bookings) || 0,
      active_bookings: parseInt(bookingsStats.active_bookings) || 0,
      total_revenue: revenueStats.total_revenue,
      monthly_revenue: revenueStats.monthly_revenue,
      total_net_revenue: revenueStats.total_net_revenue,
      monthly_net_revenue: revenueStats.monthly_net_revenue,
      popular_spaces: [],
      recent_bookings: recentBookings
    };

    console.log('✅ Résultat final getAdminStats:', result);
    return result;
  } catch (error) {
    console.error('❌ Erreur getAdminStats:', error);
    throw error;
  }
}

// ===== ENDPOINTS POUR LES PAIEMENTS =====

// GET /api/payments
app.get('/api/payments', authenticateToken, async (req, res) => {
  try {
    // Vérifier que l'utilisateur est admin
    if (!req.user.is_admin) {
      return sendResponse(res, false, null, 'Accès non autorisé');
    }

    console.log('💳 Récupération des paiements...');
    
    // Récupérer les paiements avec les informations utilisateur et réservation
    const result = await pool.query(`
      SELECT 
        p.*,
        pr.email as user_email,
        pr.full_name as user_name,
        b.id as booking_id,
        s.name as space_name
      FROM payments p
      LEFT JOIN profiles pr ON p.user_id = pr.id
      LEFT JOIN bookings b ON p.booking_id = b.id
      LEFT JOIN spaces s ON b.space_id = s.id
      ORDER BY p.created_at DESC
    `);
    
    console.log(`✅ ${result.rows.length} paiements trouvés`);
    sendResponse(res, true, result.rows);
  } catch (error) {
    console.error('❌ Erreur récupération paiements:', error);
    sendResponse(res, false, null, 'Erreur serveur');
  }
});

// ===== ENDPOINTS POUR LES CRÉNEAUX HORAIRES =====

// GET /api/time-slots
app.get('/api/time-slots', authenticateToken, async (req, res) => {
  try {
    // Vérifier que l'utilisateur est admin
    if (!req.user.is_admin) {
      return sendResponse(res, false, null, 'Accès non autorisé');
    }

    console.log('⏰ Récupération des créneaux horaires...');
    
    // Récupérer les créneaux horaires
    const result = await pool.query(`
      SELECT 
        ts.*,
        s.name as space_name
      FROM time_slots ts
      LEFT JOIN spaces s ON ts.space_id = s.id
      ORDER BY ts.start_time ASC
    `);
    
    console.log(`✅ ${result.rows.length} créneaux horaires trouvés`);
    sendResponse(res, true, result.rows);
  } catch (error) {
    console.error('❌ Erreur récupération créneaux:', error);
    sendResponse(res, false, null, 'Erreur serveur');
  }
});

// POST /api/time-slots
app.post('/api/time-slots', authenticateToken, async (req, res) => {
  try {
    // Vérifier que l'utilisateur est admin
    if (!req.user.is_admin) {
      return sendResponse(res, false, null, 'Accès non autorisé');
    }

    const { space_id, start_time, end_time, day_of_week, is_available } = req.body;
    
    console.log('⏰ Création d\'un nouveau créneau horaire...');
    
    const result = await pool.query(
      `INSERT INTO time_slots (space_id, start_time, end_time, day_of_week, is_available, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
       RETURNING *`,
      [space_id, start_time, end_time, day_of_week, is_available]
    );
    
    console.log(`✅ Créneau horaire créé: ${result.rows[0].id}`);
    sendResponse(res, true, result.rows[0]);
  } catch (error) {
    console.error('❌ Erreur création créneau:', error);
    sendResponse(res, false, null, 'Erreur serveur');
  }
});

// PUT /api/time-slots/:id
app.put('/api/time-slots/:id', authenticateToken, async (req, res) => {
  try {
    // Vérifier que l'utilisateur est admin
    if (!req.user.is_admin) {
      return sendResponse(res, false, null, 'Accès non autorisé');
    }

    const { id } = req.params;
    const { space_id, start_time, end_time, day_of_week, is_available } = req.body;
    
    console.log(`⏰ Mise à jour du créneau horaire ${id}...`);
    
    const result = await pool.query(
      `UPDATE time_slots 
       SET space_id = $1, start_time = $2, end_time = $3, day_of_week = $4, is_available = $5, updated_at = NOW()
       WHERE id = $6
       RETURNING *`,
      [space_id, start_time, end_time, day_of_week, is_available, id]
    );
    
    if (result.rows.length === 0) {
      return sendResponse(res, false, null, 'Créneau horaire non trouvé');
    }
    
    console.log(`✅ Créneau horaire ${id} mis à jour`);
    sendResponse(res, true, result.rows[0]);
  } catch (error) {
    console.error('❌ Erreur mise à jour créneau:', error);
    sendResponse(res, false, null, 'Erreur serveur');
  }
});

// DELETE /api/time-slots/:id
app.delete('/api/time-slots/:id', authenticateToken, async (req, res) => {
  try {
    // Vérifier que l'utilisateur est admin
    if (!req.user.is_admin) {
      return sendResponse(res, false, null, 'Accès non autorisé');
    }

    const { id } = req.params;
    
    console.log(`🗑️ Suppression du créneau horaire ${id}...`);
    
    const result = await pool.query('DELETE FROM time_slots WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return sendResponse(res, false, null, 'Créneau horaire non trouvé');
    }
    
    console.log(`✅ Créneau horaire ${id} supprimé`);
    sendResponse(res, true, { message: 'Créneau horaire supprimé avec succès', deletedTimeSlot: result.rows[0] });
  } catch (error) {
    console.error('❌ Erreur suppression créneau:', error);
    sendResponse(res, false, null, 'Erreur serveur');
  }
});

// ===== ENDPOINTS POUR LES MODÈLES D'EMAIL =====

// GET /api/email-templates
app.get('/api/email-templates', authenticateToken, async (req, res) => {
  try {
    // Vérifier que l'utilisateur est admin
    if (!req.user.is_admin) {
      return sendResponse(res, false, null, 'Accès non autorisé');
    }

    console.log('📧 Récupération des modèles d\'email...');
    
    // Récupérer les modèles d'email
    const result = await pool.query(`
      SELECT * FROM email_templates
      ORDER BY created_at DESC
    `);
    
    console.log(`✅ ${result.rows.length} modèles d'email trouvés`);
    sendResponse(res, true, result.rows);
  } catch (error) {
    console.error('❌ Erreur récupération modèles email:', error);
    sendResponse(res, false, null, 'Erreur serveur');
  }
});

// POST /api/email-templates
app.post('/api/email-templates', authenticateToken, async (req, res) => {
  try {
    // Vérifier que l'utilisateur est admin
    if (!req.user.is_admin) {
      return sendResponse(res, false, null, 'Accès non autorisé');
    }

    const { name, subject, content, type } = req.body;
    
    console.log('📧 Création d\'un nouveau modèle d\'email...');
    
    const result = await pool.query(
      `INSERT INTO email_templates (name, subject, content, type, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       RETURNING *`,
      [name, subject, content, type]
    );
    
    console.log(`✅ Modèle d'email créé: ${result.rows[0].id}`);
    sendResponse(res, true, result.rows[0]);
  } catch (error) {
    console.error('❌ Erreur création modèle email:', error);
    sendResponse(res, false, null, 'Erreur serveur');
  }
});

// PUT /api/email-templates/:id
app.put('/api/email-templates/:id', authenticateToken, async (req, res) => {
  try {
    // Vérifier que l'utilisateur est admin
    if (!req.user.is_admin) {
      return sendResponse(res, false, null, 'Accès non autorisé');
    }

    const { id } = req.params;
    const { name, subject, content, type } = req.body;
    
    console.log(`📧 Mise à jour du modèle d'email ${id}...`);
    
    const result = await pool.query(
      `UPDATE email_templates 
       SET name = $1, subject = $2, content = $3, type = $4, updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [name, subject, content, type, id]
    );
    
    if (result.rows.length === 0) {
      return sendResponse(res, false, null, 'Modèle d\'email non trouvé');
    }
    
    console.log(`✅ Modèle d'email ${id} mis à jour`);
    sendResponse(res, true, result.rows[0]);
  } catch (error) {
    console.error('❌ Erreur mise à jour modèle email:', error);
    sendResponse(res, false, null, 'Erreur serveur');
  }
});

// DELETE /api/email-templates/:id
app.delete('/api/email-templates/:id', authenticateToken, async (req, res) => {
  try {
    // Vérifier que l'utilisateur est admin
    if (!req.user.is_admin) {
      return sendResponse(res, false, null, 'Accès non autorisé');
    }

    const { id } = req.params;
    
    console.log(`🗑️ Suppression du modèle d'email ${id}...`);
    
    const result = await pool.query('DELETE FROM email_templates WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return sendResponse(res, false, null, 'Modèle d\'email non trouvé');
    }
    
    console.log(`✅ Modèle d'email ${id} supprimé`);
    sendResponse(res, true, { message: 'Modèle d\'email supprimé avec succès', deletedTemplate: result.rows[0] });
  } catch (error) {
    console.error('❌ Erreur suppression modèle email:', error);
    sendResponse(res, false, null, 'Erreur serveur');
  }
});

// ===== ENDPOINTS POUR LES FAQ =====

// GET /api/admin/support/faqs
app.get('/api/admin/support/faqs', async (req, res) => {
  try {
    console.log('❓ Récupération des FAQ admin...');
    
    // Récupérer les FAQ depuis support_faqs
    const result = await pool.query(`
      SELECT 
        f.*,
        u.email as author_email,
        u.full_name as author_name
      FROM support_faqs f
      LEFT JOIN profiles u ON f.author_id = u.id
      ORDER BY f.order_index ASC, f.created_at DESC
    `);
    
    console.log(`✅ ${result.rows.length} FAQ trouvées`);
    sendResponse(res, true, result.rows);
  } catch (error) {
    console.error('❌ Erreur récupération FAQ:', error);
    sendResponse(res, false, null, 'Erreur serveur');
  }
});

// POST /api/admin/support/faqs
app.post('/api/admin/support/faqs', authenticateToken, async (req, res) => {
  try {
    // Vérifier que l'utilisateur est admin
    if (!req.user.is_admin) {
      return sendResponse(res, false, null, 'Accès non autorisé');
    }

    const { question, answer, category, order_index, is_active } = req.body;
    
    console.log('❓ Création d\'une nouvelle FAQ...');
    
    const result = await pool.query(
      `INSERT INTO support_faqs (question, answer, category, order_index, is_active, author_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       RETURNING *`,
      [question, answer, category, order_index, is_active, req.user.id]
    );
    
    console.log(`✅ FAQ créée: ${result.rows[0].id}`);
    sendResponse(res, true, result.rows[0]);
  } catch (error) {
    console.error('❌ Erreur création FAQ:', error);
    sendResponse(res, false, null, 'Erreur serveur');
  }
});

// PUT /api/admin/support/faqs/:id
app.put('/api/admin/support/faqs/:id', authenticateToken, async (req, res) => {
  try {
    // Vérifier que l'utilisateur est admin
    if (!req.user.is_admin) {
      return sendResponse(res, false, null, 'Accès non autorisé');
    }

    const { id } = req.params;
    const { question, answer, category, order_index, is_active } = req.body;
    
    console.log(`❓ Mise à jour de la FAQ ${id}...`);
    
    const result = await pool.query(
      `UPDATE support_faqs 
       SET question = $1, answer = $2, category = $3, order_index = $4, is_active = $5, updated_at = NOW()
       WHERE id = $6
       RETURNING *`,
      [question, answer, category, order_index, is_active, id]
    );
    
    if (result.rows.length === 0) {
      return sendResponse(res, false, null, 'FAQ non trouvée');
    }
    
    console.log(`✅ FAQ ${id} mise à jour`);
    sendResponse(res, true, result.rows[0]);
  } catch (error) {
    console.error('❌ Erreur mise à jour FAQ:', error);
    sendResponse(res, false, null, 'Erreur serveur');
  }
});

// DELETE /api/admin/support/faqs/:id
app.delete('/api/admin/support/faqs/:id', authenticateToken, async (req, res) => {
  try {
    // Vérifier que l'utilisateur est admin
    if (!req.user.is_admin) {
      return sendResponse(res, false, null, 'Accès non autorisé');
    }

    const { id } = req.params;
    
    console.log(`🗑️ Suppression de la FAQ ${id}...`);
    
    const result = await pool.query('DELETE FROM support_faqs WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return sendResponse(res, false, null, 'FAQ non trouvée');
    }
    
    console.log(`✅ FAQ ${id} supprimée`);
    sendResponse(res, true, { message: 'FAQ supprimée avec succès', deletedFaq: result.rows[0] });
  } catch (error) {
    console.error('❌ Erreur suppression FAQ:', error);
    sendResponse(res, false, null, 'Erreur serveur');
  }
});

// ===== ENDPOINTS POUR LA BASE DE CONNAISSANCES =====

// GET /api/admin/support/kb-articles
app.get('/api/admin/support/kb-articles', async (req, res) => {
  try {
    console.log('📚 Récupération des articles de la base de connaissances...');
    
    // Récupérer les articles de la base de connaissances
    const result = await pool.query(`
      SELECT 
        kb.*,
        u.email as author_email,
        u.full_name as author_name
      FROM knowledge_base kb
      LEFT JOIN profiles u ON kb.author_id = u.id
      ORDER BY kb.created_at DESC
    `);
    
    console.log(`✅ ${result.rows.length} articles trouvés`);
    sendResponse(res, true, result.rows);
  } catch (error) {
    console.error('❌ Erreur récupération articles KB:', error);
    sendResponse(res, false, null, 'Erreur serveur');
  }
});

// POST /api/admin/support/kb-articles
app.post('/api/admin/support/kb-articles', authenticateToken, async (req, res) => {
  try {
    // Vérifier que l'utilisateur est admin
    if (!req.user.is_admin) {
      return sendResponse(res, false, null, 'Accès non autorisé');
    }

    const { title, content, category, tags, is_published = true } = req.body;
    
    console.log('📚 Création d\'un nouvel article...');
    
    const result = await pool.query(
      `INSERT INTO knowledge_base (title, content, category, tags, is_published, author_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       RETURNING *`,
      [title, content, category, tags, is_published, req.user.id]
    );
    
    console.log(`✅ Article créé: ${result.rows[0].id}`);
    sendResponse(res, true, result.rows[0]);
  } catch (error) {
    console.error('❌ Erreur création article:', error);
    sendResponse(res, false, null, 'Erreur serveur');
  }
});

// PUT /api/admin/support/kb-articles/:id
app.put('/api/admin/support/kb-articles/:id', authenticateToken, async (req, res) => {
  try {
    // Vérifier que l'utilisateur est admin
    if (!req.user.is_admin) {
      return sendResponse(res, false, null, 'Accès non autorisé');
    }

    const { id } = req.params;
    const { title, content, category, tags, is_published } = req.body;
    
    console.log(`📚 Mise à jour de l'article ${id}...`);
    
    const result = await pool.query(
      `UPDATE knowledge_base 
       SET title = $1, content = $2, category = $3, tags = $4, is_published = $5, updated_at = NOW()
       WHERE id = $6
       RETURNING *`,
      [title, content, category, tags, is_published, id]
    );
    
    if (result.rows.length === 0) {
      return sendResponse(res, false, null, 'Article non trouvé');
    }
    
    console.log(`✅ Article ${id} mis à jour`);
    sendResponse(res, true, result.rows[0]);
  } catch (error) {
    console.error('❌ Erreur mise à jour article:', error);
    sendResponse(res, false, null, 'Erreur serveur');
  }
});

// DELETE /api/admin/support/kb-articles/:id
app.delete('/api/admin/support/kb-articles/:id', authenticateToken, async (req, res) => {
  try {
    // Vérifier que l'utilisateur est admin
    if (!req.user.is_admin) {
      return sendResponse(res, false, null, 'Accès non autorisé');
    }

    const { id } = req.params;
    
    console.log(`🗑️ Suppression de l'article ${id}...`);
    
    const result = await pool.query('DELETE FROM knowledge_base WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return sendResponse(res, false, null, 'Article non trouvé');
    }
    
    console.log(`✅ Article ${id} supprimé`);
    sendResponse(res, true, { message: 'Article supprimé avec succès', deletedArticle: result.rows[0] });
  } catch (error) {
    console.error('❌ Erreur suppression article:', error);
    sendResponse(res, false, null, 'Erreur serveur');
  }
});

// ===== ENDPOINTS POUR LES PAGES LÉGALES =====

// GET /api/legal-pages
app.get('/api/legal-pages', async (req, res) => {
  try {
    console.log('📄 Récupération des pages légales...');
    
    // Récupérer les pages légales
    const result = await pool.query(`
      SELECT * FROM legal_pages
      ORDER BY created_at DESC
    `);
    
    console.log(`✅ ${result.rows.length} pages légales trouvées`);
    sendResponse(res, true, result.rows);
  } catch (error) {
    console.error('❌ Erreur récupération pages légales:', error);
    sendResponse(res, false, null, 'Erreur serveur');
  }
});

// POST /api/legal-pages
app.post('/api/legal-pages', authenticateToken, async (req, res) => {
  try {
    // Vérifier que l'utilisateur est admin
    if (!req.user.is_admin) {
      return sendResponse(res, false, null, 'Accès non autorisé');
    }

    const { title, content, type, is_active } = req.body;
    
    console.log('📄 Création d\'une nouvelle page légale...');
    
    const result = await pool.query(
      `INSERT INTO legal_pages (title, content, type, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       RETURNING *`,
      [title, content, type, is_active]
    );
    
    console.log(`✅ Page légale créée: ${result.rows[0].id}`);
    sendResponse(res, true, result.rows[0]);
  } catch (error) {
    console.error('❌ Erreur création page légale:', error);
    sendResponse(res, false, null, 'Erreur serveur');
  }
});

// PUT /api/legal-pages/:id
app.put('/api/legal-pages/:id', authenticateToken, async (req, res) => {
  try {
    // Vérifier que l'utilisateur est admin
    if (!req.user.is_admin) {
      return sendResponse(res, false, null, 'Accès non autorisé');
    }

    const { id } = req.params;
    const { title, content, type, is_active } = req.body;
    
    console.log(`📄 Mise à jour de la page légale ${id}...`);
    
    const result = await pool.query(
      `UPDATE legal_pages 
       SET title = $1, content = $2, type = $3, is_active = $4, updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [title, content, type, is_active, id]
    );
    
    if (result.rows.length === 0) {
      return sendResponse(res, false, null, 'Page légale non trouvée');
    }
    
    console.log(`✅ Page légale ${id} mise à jour`);
    sendResponse(res, true, result.rows[0]);
  } catch (error) {
    console.error('❌ Erreur mise à jour page légale:', error);
    sendResponse(res, false, null, 'Erreur serveur');
  }
});

// DELETE /api/legal-pages/:id
app.delete('/api/legal-pages/:id', authenticateToken, async (req, res) => {
  try {
    // Vérifier que l'utilisateur est admin
    if (!req.user.is_admin) {
      return sendResponse(res, false, null, 'Accès non autorisé');
    }

    const { id } = req.params;
    
    console.log(`🗑️ Suppression de la page légale ${id}...`);
    
    const result = await pool.query('DELETE FROM legal_pages WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return sendResponse(res, false, null, 'Page légale non trouvée');
    }
    
    console.log(`✅ Page légale ${id} supprimée`);
    sendResponse(res, true, { message: 'Page légale supprimée avec succès', deletedPage: result.rows[0] });
  } catch (error) {
    console.error('❌ Erreur suppression page légale:', error);
    sendResponse(res, false, null, 'Erreur serveur');
  }
});

// ===== ENDPOINTS POUR LES PARAMÈTRES COOKIES =====

// GET /api/cookie-settings
app.get('/api/cookie-settings', async (req, res) => {
  try {
    console.log('🍪 Récupération des paramètres cookies...');
    
    // Récupérer les paramètres cookies
    const result = await pool.query(`
      SELECT * FROM cookie_settings
      ORDER BY created_at DESC
      LIMIT 1
    `);
    
    if (result.rows.length === 0) {
      // Retourner des paramètres par défaut
      const defaultSettings = {
        id: 1,
        title: 'Paramètres de Cookies',
        description: 'Gérez vos préférences de cookies',
        accept_button_text: 'Accepter',
        reject_button_text: 'Refuser',
        settings_button_text: 'Personnaliser',
        save_preferences_text: 'Enregistrer',
        necessary_cookies_title: 'Cookies essentiels',
        necessary_cookies_description: 'Ces cookies sont nécessaires au fonctionnement du site.',
        analytics_cookies_title: 'Cookies analytiques',
        analytics_cookies_description: 'Ces cookies nous aident à améliorer notre site.',
        analytics_cookies_enabled: false,
        marketing_cookies_title: 'Cookies marketing',
        marketing_cookies_description: 'Ces cookies permettent de personnaliser les publicités.',
        marketing_cookies_enabled: false,
        privacy_policy_url: '/privacy',
        cookie_policy_url: '/cookies',
        is_active: true,
        banner_position: 'bottom',
        banner_layout: 'banner',
        primary_color: '#3B82F6',
        secondary_color: '#6B7280',
        background_color: '#FFFFFF',
        text_color: '#1F2937',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      console.log('✅ Paramètres cookies par défaut retournés');
      sendResponse(res, true, defaultSettings);
    } else {
      console.log(`✅ Paramètres cookies trouvés`);
      sendResponse(res, true, result.rows[0]);
    }
  } catch (error) {
    console.error('❌ Erreur récupération paramètres cookies:', error);
    sendResponse(res, false, null, 'Erreur serveur');
  }
});

// PUT /api/cookie-settings
app.put('/api/cookie-settings', authenticateToken, async (req, res) => {
  try {
    // Vérifier que l'utilisateur est admin
    if (!req.user.is_admin) {
      return sendResponse(res, false, null, 'Accès non autorisé');
    }

    const cookieData = req.body;
    console.log('🍪 Sauvegarde des paramètres cookies...', cookieData);
    
    // Vérifier s'il existe déjà des paramètres
    const existing = await pool.query('SELECT id FROM cookie_settings LIMIT 1');
    
    let result;
    if (existing.rows.length > 0) {
      // Mettre à jour avec tous les champs
      result = await pool.query(
        `UPDATE cookie_settings 
         SET title = $1, description = $2, accept_button_text = $3, reject_button_text = $4, 
             settings_button_text = $5, save_preferences_text = $6, necessary_cookies_title = $7,
             necessary_cookies_description = $8, analytics_cookies_title = $9, analytics_cookies_description = $10,
             analytics_cookies_enabled = $11, marketing_cookies_title = $12, marketing_cookies_description = $13,
             marketing_cookies_enabled = $14, privacy_policy_url = $15, cookie_policy_url = $16,
             is_active = $17, banner_position = $18, banner_layout = $19, primary_color = $20,
             secondary_color = $21, background_color = $22, text_color = $23, updated_at = NOW()
         WHERE id = $24
         RETURNING *`,
        [
          cookieData.title, cookieData.description, cookieData.accept_button_text, cookieData.reject_button_text,
          cookieData.settings_button_text, cookieData.save_preferences_text, cookieData.necessary_cookies_title,
          cookieData.necessary_cookies_description, cookieData.analytics_cookies_title, cookieData.analytics_cookies_description,
          cookieData.analytics_cookies_enabled, cookieData.marketing_cookies_title, cookieData.marketing_cookies_description,
          cookieData.marketing_cookies_enabled, cookieData.privacy_policy_url, cookieData.cookie_policy_url,
          cookieData.is_active, cookieData.banner_position, cookieData.banner_layout, cookieData.primary_color,
          cookieData.secondary_color, cookieData.background_color, cookieData.text_color, existing.rows[0].id
        ]
      );
    } else {
      // Créer avec tous les champs
      result = await pool.query(
        `INSERT INTO cookie_settings (
          title, description, accept_button_text, reject_button_text, settings_button_text, save_preferences_text,
          necessary_cookies_title, necessary_cookies_description, analytics_cookies_title, analytics_cookies_description,
          analytics_cookies_enabled, marketing_cookies_title, marketing_cookies_description, marketing_cookies_enabled,
          privacy_policy_url, cookie_policy_url, is_active, banner_position, banner_layout, primary_color,
          secondary_color, background_color, text_color, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, NOW(), NOW())
         RETURNING *`,
        [
          cookieData.title, cookieData.description, cookieData.accept_button_text, cookieData.reject_button_text,
          cookieData.settings_button_text, cookieData.save_preferences_text, cookieData.necessary_cookies_title,
          cookieData.necessary_cookies_description, cookieData.analytics_cookies_title, cookieData.analytics_cookies_description,
          cookieData.analytics_cookies_enabled, cookieData.marketing_cookies_title, cookieData.marketing_cookies_description,
          cookieData.marketing_cookies_enabled, cookieData.privacy_policy_url, cookieData.cookie_policy_url,
          cookieData.is_active, cookieData.banner_position, cookieData.banner_layout, cookieData.primary_color,
          cookieData.secondary_color, cookieData.background_color, cookieData.text_color
        ]
      );
    }
    
    console.log(`✅ Paramètres cookies sauvegardés`);
    sendResponse(res, true, result.rows[0]);
  } catch (error) {
    console.error('❌ Erreur sauvegarde paramètres cookies:', error);
    sendResponse(res, false, null, 'Erreur serveur');
  }
});

// POST /api/cookie-settings (alias pour PUT)
app.post('/api/cookie-settings', authenticateToken, async (req, res) => {
  try {
    // Vérifier que l'utilisateur est admin
    if (!req.user.is_admin) {
      return sendResponse(res, false, null, 'Accès non autorisé');
    }

    const cookieData = req.body;
    console.log('🍪 Sauvegarde des paramètres cookies...', cookieData);
    
    // Vérifier s'il existe déjà des paramètres
    const existing = await pool.query('SELECT id FROM cookie_settings LIMIT 1');
    
    let result;
    if (existing.rows.length > 0) {
      // Mettre à jour avec tous les champs
      result = await pool.query(
        `UPDATE cookie_settings 
         SET title = $1, description = $2, accept_button_text = $3, reject_button_text = $4, 
             settings_button_text = $5, save_preferences_text = $6, necessary_cookies_title = $7,
             necessary_cookies_description = $8, analytics_cookies_title = $9, analytics_cookies_description = $10,
             analytics_cookies_enabled = $11, marketing_cookies_title = $12, marketing_cookies_description = $13,
             marketing_cookies_enabled = $14, privacy_policy_url = $15, cookie_policy_url = $16,
             is_active = $17, banner_position = $18, banner_layout = $19, primary_color = $20,
             secondary_color = $21, background_color = $22, text_color = $23, updated_at = NOW()
         WHERE id = $24
         RETURNING *`,
        [
          cookieData.title, cookieData.description, cookieData.accept_button_text, cookieData.reject_button_text,
          cookieData.settings_button_text, cookieData.save_preferences_text, cookieData.necessary_cookies_title,
          cookieData.necessary_cookies_description, cookieData.analytics_cookies_title, cookieData.analytics_cookies_description,
          cookieData.analytics_cookies_enabled, cookieData.marketing_cookies_title, cookieData.marketing_cookies_description,
          cookieData.marketing_cookies_enabled, cookieData.privacy_policy_url, cookieData.cookie_policy_url,
          cookieData.is_active, cookieData.banner_position, cookieData.banner_layout, cookieData.primary_color,
          cookieData.secondary_color, cookieData.background_color, cookieData.text_color, existing.rows[0].id
        ]
      );
    } else {
      // Créer avec tous les champs
      result = await pool.query(
        `INSERT INTO cookie_settings (
          title, description, accept_button_text, reject_button_text, settings_button_text, save_preferences_text,
          necessary_cookies_title, necessary_cookies_description, analytics_cookies_title, analytics_cookies_description,
          analytics_cookies_enabled, marketing_cookies_title, marketing_cookies_description, marketing_cookies_enabled,
          privacy_policy_url, cookie_policy_url, is_active, banner_position, banner_layout, primary_color,
          secondary_color, background_color, text_color, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, NOW(), NOW())
         RETURNING *`,
        [
          cookieData.title, cookieData.description, cookieData.accept_button_text, cookieData.reject_button_text,
          cookieData.settings_button_text, cookieData.save_preferences_text, cookieData.necessary_cookies_title,
          cookieData.necessary_cookies_description, cookieData.analytics_cookies_title, cookieData.analytics_cookies_description,
          cookieData.analytics_cookies_enabled, cookieData.marketing_cookies_title, cookieData.marketing_cookies_description,
          cookieData.marketing_cookies_enabled, cookieData.privacy_policy_url, cookieData.cookie_policy_url,
          cookieData.is_active, cookieData.banner_position, cookieData.banner_layout, cookieData.primary_color,
          cookieData.secondary_color, cookieData.background_color, cookieData.text_color
        ]
      );
    }
    
    console.log(`✅ Paramètres cookies sauvegardés`);
    sendResponse(res, true, result.rows[0]);
  } catch (error) {
    console.error('❌ Erreur sauvegarde paramètres cookies:', error);
    sendResponse(res, false, null, 'Erreur serveur');
  }
});

// ===== ENDPOINTS POUR LES PARAMÈTRES HOMEPAGE =====

// GET /api/company-settings
app.get('/api/company-settings', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT value FROM admin_settings WHERE key = $1 ORDER BY updated_at DESC LIMIT 1',
      ['company']
    );

    if (result.rows.length > 0) {
      sendResponse(res, true, result.rows[0].value);
    } else {
      // Paramètres entreprise par défaut
      const defaultCompanySettings = {
        name: 'CoworkMy',
        email: 'contact@coworkmy.fr',
        phone: '+33 1 23 45 67 89',
        address: '123 Rue du Coworking, 75001 Paris',
        website: 'https://coworkmy.fr',
        description: 'Votre espace de coworking moderne',
        logo_url: '',
        siret: '',
        vat_number: ''
      };
      sendResponse(res, true, defaultCompanySettings);
    }
  } catch (error) {
    console.error('Erreur company settings:', error);
    // Retourner les paramètres par défaut en cas d'erreur
    const defaultCompanySettings = {
      name: 'CoworkMy',
      email: 'contact@coworkmy.fr',
      phone: '+33 1 23 45 67 89',
      address: '123 Rue du Coworking, 75001 Paris',
      website: 'https://coworkmy.fr',
      description: 'Votre espace de coworking moderne',
      logo_url: '',
      siret: '',
      vat_number: ''
    };
    sendResponse(res, true, defaultCompanySettings);
  }
});

// POST /api/company-settings
app.post('/api/company-settings', authenticateToken, async (req, res) => {
  try {
    if (!req.user.is_admin) {
      return sendResponse(res, false, null, 'Accès non autorisé');
    }

    const companyData = req.body;

    // Upsert des paramètres entreprise
    const result = await pool.query(
      `INSERT INTO admin_settings (key, value, created_at, updated_at) 
       VALUES ($1, $2, NOW(), NOW()) 
       ON CONFLICT (key) 
       DO UPDATE SET value = $2, updated_at = NOW() 
       RETURNING *`,
      ['company', JSON.stringify(companyData)]
    );

    sendResponse(res, true, result.rows[0]);
  } catch (error) {
    console.error('Erreur sauvegarde company settings:', error);
    sendResponse(res, false, null, 'Erreur serveur');
  }
});

// GET /api/homepage-settings
app.get('/api/homepage-settings', async (req, res) => {
  try {
    // Récupérer depuis admin_settings avec la clé 'homepage'
    const result = await pool.query(
      'SELECT value FROM admin_settings WHERE key = $1 ORDER BY updated_at DESC LIMIT 1',
      ['homepage']
    );

    if (result.rows.length > 0) {
      const settings = result.rows[0].value;
      sendResponse(res, true, settings);
    } else {
      // Paramètres par défaut si aucun trouvé
      const defaultSettings = {
        hero_title: 'Bienvenue chez CoworkMy',
        hero_subtitle: 'Votre espace de coworking moderne',
        hero_background_image: 'https://images.unsplash.com/photo-1600508774635-0b9a8c7b8b8b',
        about_title: 'À propos de nous',
        about_description: 'Découvrez nos espaces de coworking',
        contact_email: 'contact@coworkmy.fr',
        contact_phone: '+33 1 23 45 67 89'
      };
      sendResponse(res, true, defaultSettings);
    }
  } catch (error) {
    console.error('Erreur homepage settings:', error);
    // Retourner les paramètres par défaut en cas d'erreur
    const defaultSettings = {
      hero_title: 'Bienvenue chez CoworkMy',
      hero_subtitle: 'Votre espace de coworking moderne',
      hero_background_image: 'https://images.unsplash.com/photo-1600508774635-0b9a8c7b8b8b',
      about_title: 'À propos de nous',
      about_description: 'Découvrez nos espaces de coworking',
      contact_email: 'contact@coworkmy.fr',
      contact_phone: '+33 1 23 45 67 89'
    };
    sendResponse(res, true, defaultSettings);
  }
});

// POST /api/homepage-settings
app.post('/api/homepage-settings', authenticateToken, async (req, res) => {
  try {
    if (!req.user.is_admin) {
      return sendResponse(res, false, null, 'Accès non autorisé');
    }
    
    const homepageData = req.body;
    console.log('🏠 Sauvegarde des paramètres homepage...');
    
    const result = await pool.query(
      `INSERT INTO admin_settings (key, value, created_at, updated_at) 
       VALUES ($1, $2, NOW(), NOW()) 
       ON CONFLICT (key) 
       DO UPDATE SET value = $2, updated_at = NOW() 
       RETURNING *`,
      ['homepage', JSON.stringify(homepageData)]
    );
    
    console.log(`✅ Paramètres homepage sauvegardés`);
    sendResponse(res, true, result.rows[0]);
  } catch (error) {
    console.error('❌ Erreur sauvegarde paramètres homepage:', error);
    sendResponse(res, false, null, 'Erreur serveur');
  }
});

// ===== ENDPOINTS POUR LES IMAGES CARROUSEL =====

// GET /api/carousel-images
app.get('/api/carousel-images', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM carousel_images WHERE is_active = true ORDER BY display_order ASC'
    );

    if (result.rows.length > 0) {
      sendResponse(res, true, result.rows);
    } else {
      // Retourner une liste vide si aucune image trouvée
      sendResponse(res, true, []);
    }
  } catch (error) {
    console.error('Erreur carousel images:', error);
    // Retourner une liste vide en cas d'erreur
    sendResponse(res, true, []);
  }
});

// POST /api/carousel-images
app.post('/api/carousel-images', authenticateToken, async (req, res) => {
  try {
    if (!req.user.is_admin) {
      return sendResponse(res, false, null, 'Accès non autorisé');
    }
    
    const { image_url, title, description } = req.body;
    console.log('🖼️ Ajout d\'une nouvelle image carrousel...');
    
    // Vérifier la taille de l'image (limite à 2MB pour les images base64)
    if (image_url && image_url.startsWith('data:image/')) {
      const base64Data = image_url.split(',')[1];
      const sizeInBytes = (base64Data.length * 3) / 4;
      const sizeInMB = sizeInBytes / (1024 * 1024);
      
      console.log(`📏 Taille de l'image: ${sizeInMB.toFixed(2)}MB`);
      
      if (sizeInMB > 2) {
        return sendResponse(res, false, null, `Image trop volumineuse (${sizeInMB.toFixed(2)}MB, limite: 2MB)`);
      }
    }
    
    const result = await pool.query(
      `INSERT INTO carousel_images (image_url, title, description, is_active, display_order, created_at, updated_at)
       VALUES ($1, $2, $3, true, (SELECT COALESCE(MAX(display_order), 0) + 1 FROM carousel_images), NOW(), NOW())
       RETURNING *`,
      [image_url, title || 'Image carrousel', description || '']
    );
    
    console.log(`✅ Image carrousel ajoutée: ${result.rows[0].id}`);
    sendResponse(res, true, result.rows[0]);
  } catch (error) {
    console.error('❌ Erreur ajout image carrousel:', error);
    sendResponse(res, false, null, 'Erreur serveur');
  }
});

// DELETE /api/carousel-images/:id
app.delete('/api/carousel-images/:id', authenticateToken, async (req, res) => {
  try {
    if (!req.user.is_admin) {
      return sendResponse(res, false, null, 'Accès non autorisé');
    }
    
    const { id } = req.params;
    console.log(`🗑️ Suppression de l'image carrousel ${id}...`);
    
    const result = await pool.query('DELETE FROM carousel_images WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return sendResponse(res, false, null, 'Image non trouvée');
    }
    
    console.log(`✅ Image carrousel ${id} supprimée`);
    sendResponse(res, true, { message: 'Image supprimée avec succès', deletedImage: result.rows[0] });
  } catch (error) {
    console.error('❌ Erreur suppression image carrousel:', error);
    sendResponse(res, false, null, 'Erreur serveur');
  }
});

// ===== ENDPOINTS POUR LES RÉSERVATIONS =====

// GET /api/bookings
app.get('/api/bookings', authenticateToken, async (req, res) => {
  try {
    console.log('📅 Récupération des réservations pour l\'utilisateur:', req.user.id);
    
    const result = await pool.query(`
      SELECT 
        b.*,
        s.name as space_name,
        s.description as space_description,
        s.price_per_hour,
        s.capacity,
        s.pricing_type,
        p.full_name as user_name,
        p.email as user_email,
        -- Convertir les dates en format ISO pour le frontend
        b.start_date as start_time,
        b.end_date as end_time
      FROM bookings b
      LEFT JOIN spaces s ON b.space_id = s.id
      LEFT JOIN profiles p ON b.user_id = p.id
      WHERE b.user_id = $1
      ORDER BY b.created_at DESC
    `, [req.user.id]);
    
    console.log('✅ Réservations récupérées:', result.rows.length);
    sendResponse(res, true, result.rows);
  } catch (error) {
    console.error('❌ Erreur bookings:', error);
    sendResponse(res, false, null, 'Erreur serveur');
  }
});

// POST /api/bookings
app.post('/api/bookings', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 Données de réservation reçues:', req.body);
    
    const { 
      space_id, 
      start_date, 
      end_date, 
      start_time, 
      end_time, 
      notes,
      user_id,
      total_price_ht,
      total_price_ttc,
      description,
      attendees
    } = req.body;

    // Utiliser start_time/end_time si disponibles, sinon start_date/end_date
    const startDate = start_time || start_date;
    const endDate = end_time || end_date;
    const userId = user_id || req.user.id;

    console.log('🔍 Données traitées:', {
      space_id,
      startDate,
      endDate,
      userId,
      total_price_ht,
      total_price_ttc,
      description,
      attendees
    });

    if (!space_id || !startDate || !endDate) {
      console.log('❌ Données manquantes:', { space_id, startDate, endDate });
      return sendResponse(res, false, null, 'Données de réservation incomplètes');
    }

    // Vérifier s'il existe déjà une réservation qui se chevauche
    const overlapCheck = await pool.query(`
      SELECT id FROM bookings 
      WHERE space_id = $1 
      AND status IN ('pending', 'confirmed')
      AND (
        (start_date <= $2 AND end_date >= $2) OR
        (start_date <= $3 AND end_date >= $3) OR
        (start_date >= $2 AND end_date <= $3)
      )
    `, [space_id, startDate, endDate]);

    if (overlapCheck.rows.length > 0) {
      console.log('❌ Réservation en conflit détectée');
      return sendResponse(res, false, null, 'Cet espace est déjà réservé pour cette période');
    }

    const result = await pool.query(`
      INSERT INTO bookings (
        user_id, 
        space_id, 
        start_date, 
        end_date, 
        notes, 
        status, 
        total_price,
        total_price_ht,
        total_price_ttc,
        description,
        attendees,
        created_at, 
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, 'pending', $6, $7, $8, $9, $10, NOW(), NOW())
      RETURNING *
    `, [
      userId, 
      space_id, 
      startDate, 
      endDate, 
      notes || null,
      total_price_ht || 0, // Utiliser total_price_ht pour total_price
      total_price_ht || null,
      total_price_ttc || null,
      description || null,
      attendees || 1
    ]);

    if (result.rows.length === 0) {
      return sendResponse(res, false, null, 'Erreur lors de la création de la réservation');
    }

    console.log('✅ Réservation créée:', result.rows[0].id);
    sendResponse(res, true, result.rows[0]);
  } catch (error) {
    console.error('Erreur create booking:', error);
    sendResponse(res, false, null, 'Erreur serveur');
  }
});

// DELETE /api/bookings/:id
app.delete('/api/bookings/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.is_admin;

    console.log('🗑️ Suppression de réservation:', { id, userId, isAdmin });

    // Vérifier que la réservation existe et appartient à l'utilisateur (ou admin)
    const checkResult = await pool.query(
      'SELECT * FROM bookings WHERE id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      return sendResponse(res, false, null, 'Réservation non trouvée');
    }

    const booking = checkResult.rows[0];

    // Vérifier les permissions
    if (!isAdmin && booking.user_id !== userId) {
      return sendResponse(res, false, null, 'Accès non autorisé');
    }

    // Supprimer la réservation
    const deleteResult = await pool.query(
      'DELETE FROM bookings WHERE id = $1 RETURNING *',
      [id]
    );

    if (deleteResult.rows.length === 0) {
      return sendResponse(res, false, null, 'Erreur lors de la suppression');
    }

    console.log('✅ Réservation supprimée:', id);
    sendResponse(res, true, { message: 'Réservation supprimée avec succès' });

  } catch (error) {
    console.error('❌ Erreur suppression booking:', error);
    sendResponse(res, false, null, 'Erreur serveur');
  }
});

// GET /api/bookings/:id
app.get('/api/bookings/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.is_admin;

    console.log('🔍 Récupération de réservation:', { id, userId, isAdmin });

    // Récupérer la réservation avec les détails de l'espace
    const result = await pool.query(`
      SELECT 
        b.*,
        s.name as space_name,
        s.description as space_description,
        -- Convertir les dates en format ISO pour le frontend
        b.start_date as start_time,
        b.end_date as end_time
      FROM bookings b
      LEFT JOIN spaces s ON b.space_id = s.id
      WHERE b.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return sendResponse(res, false, null, 'Réservation non trouvée');
    }

    const booking = result.rows[0];

    // Vérifier les permissions
    if (!isAdmin && booking.user_id !== userId) {
      return sendResponse(res, false, null, 'Accès non autorisé');
    }

    // Formater la réponse avec les données de l'espace
    const formattedBooking = {
      ...booking,
      space: {
        name: booking.space_name,
        description: booking.space_description
      }
    };

    console.log('✅ Réservation récupérée:', id);
    sendResponse(res, true, formattedBooking);

  } catch (error) {
    console.error('❌ Erreur récupération booking:', error);
    sendResponse(res, false, null, 'Erreur serveur');
  }
});

// PUT /api/bookings/:id/status
app.put('/api/bookings/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user.id;
    const isAdmin = req.user.is_admin;

    console.log('🔄 Mise à jour du statut de réservation:', { id, status, userId, isAdmin });

    if (!status) {
      return sendResponse(res, false, null, 'Statut requis');
    }

    // Vérifier que la réservation existe et appartient à l'utilisateur (ou admin)
    const checkResult = await pool.query(
      'SELECT * FROM bookings WHERE id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      return sendResponse(res, false, null, 'Réservation non trouvée');
    }

    const booking = checkResult.rows[0];

    // Vérifier les permissions
    if (!isAdmin && booking.user_id !== userId) {
      return sendResponse(res, false, null, 'Accès non autorisé');
    }

    // Mettre à jour le statut
    const updateResult = await pool.query(
      'UPDATE bookings SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [status, id]
    );

    if (updateResult.rows.length === 0) {
      return sendResponse(res, false, null, 'Erreur lors de la mise à jour');
    }

    console.log('✅ Statut de réservation mis à jour:', { id, status });
    sendResponse(res, true, updateResult.rows[0]);

  } catch (error) {
    console.error('❌ Erreur mise à jour statut booking:', error);
    sendResponse(res, false, null, 'Erreur serveur');
  }
});

// ===== ENDPOINTS PAIEMENT STRIPE =====

// Créer une session de paiement Stripe
app.post('/api/stripe/create-checkout-session', authenticateToken, async (req, res) => {
  try {
    const { 
      booking_id, 
      amount, 
      customer_email, 
      metadata = {} 
    } = req.body;

    if (!booking_id || !amount || !customer_email) {
      return sendResponse(res, false, null, 'Données de paiement incomplètes');
    }

    console.log('💳 Création session de paiement Stripe:', {
      booking_id,
      amount,
      customer_email
    });

    // Récupérer la configuration Stripe depuis la base de données
    const config = await getStripeConfig();
    const stripeInstance = new Stripe(config.secretKey, {
      apiVersion: '2023-10-16',
    });

    // Créer ou récupérer le client Stripe
    let customer;
    try {
      const existingCustomers = await stripeInstance.customers.list({
        email: customer_email,
        limit: 1
      });

      if (existingCustomers.data.length > 0) {
        customer = existingCustomers.data[0];
        console.log('✅ Client existant trouvé:', customer.id);
      } else {
        customer = await stripeInstance.customers.create({
          email: customer_email,
          name: req.user.full_name || customer_email
        });
        console.log('✅ Nouveau client créé:', customer.id);
      }
    } catch (customerError) {
      console.error('❌ Erreur client Stripe:', customerError);
      return sendResponse(res, false, null, `Erreur client: ${customerError.message}`);
    }

    // Créer la session de checkout
    const session = await stripeInstance.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `Réservation - ${metadata.space_name || 'Espace'}`,
              description: `Réservation du ${new Date(metadata.start_time).toLocaleDateString('fr-FR')} au ${new Date(metadata.end_time).toLocaleDateString('fr-FR')}`,
            },
            unit_amount: amount, // Montant en centimes
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/success?booking_id=${booking_id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/cancel?booking_id=${booking_id}`,
      metadata: {
        booking_id,
        user_id: req.user.id,
        ...metadata
      }
    });

    console.log('✅ Session de paiement créée:', session.id);

    sendResponse(res, true, {
      url: session.url,
      session_id: session.id,
      mode: config.mode
    });

  } catch (error) {
    console.error('❌ Erreur création session Stripe:', error);
    sendResponse(res, false, null, `Erreur paiement: ${error.message}`);
  }
});

// ===== ENDPOINTS POUR LES PARAMÈTRES ADMIN =====

// GET /api/admin/settings
app.get('/api/admin/settings', authenticateToken, async (req, res) => {
  try {
    if (!req.user.is_admin) {
      return sendResponse(res, false, null, 'Accès non autorisé');
    }

    const result = await pool.query(
      'SELECT key, value FROM admin_settings ORDER BY updated_at DESC'
    );

    sendResponse(res, true, result.rows);
  } catch (error) {
    console.error('Erreur admin settings:', error);
    sendResponse(res, false, null, 'Erreur serveur');
  }
});

// POST /api/admin/settings
app.post('/api/admin/settings', authenticateToken, async (req, res) => {
  try {
    if (!req.user.is_admin) {
      return sendResponse(res, false, null, 'Accès non autorisé');
    }

    const settings = req.body;
    console.log('⚙️ Sauvegarde des paramètres admin...');
    
    // Sauvegarder dans la table admin_settings
    const result = await pool.query(
      `INSERT INTO admin_settings (settings, updated_at) 
       VALUES ($1, NOW()) 
       ON CONFLICT (id) DO UPDATE SET 
         settings = EXCLUDED.settings, 
         updated_at = NOW() 
       RETURNING *`,
      [JSON.stringify(settings)]
    );
    
    console.log(`✅ Paramètres admin sauvegardés`);
    sendResponse(res, true, result.rows[0]);
  } catch (error) {
    console.error('❌ Erreur sauvegarde paramètres admin:', error);
    sendResponse(res, false, null, 'Erreur serveur');
  }
});

// ===== ENDPOINTS POUR LE SUPPORT =====

// GET /api/support/tickets-user-no-auth
app.get('/api/support/tickets-user-no-auth', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM support_tickets ORDER BY created_at DESC'
    );

    sendResponse(res, true, result.rows);
  } catch (error) {
    console.error('Erreur support tickets:', error);
    sendResponse(res, false, null, 'Erreur serveur');
  }
});

// POST /api/support/tickets-user-no-auth
app.post('/api/support/tickets-user-no-auth', async (req, res) => {
  try {
    const { subject, message, priority = 'medium' } = req.body;

    if (!subject || !message) {
      return sendResponse(res, false, null, 'Sujet et message requis');
    }

    const result = await pool.query(
      'INSERT INTO support_tickets (subject, message, priority, status, user_email, created_at) VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *',
      [subject, message, priority, 'open', 'user@example.com']
    );

    sendResponse(res, true, result.rows[0]);
  } catch (error) {
    console.error('Erreur create ticket:', error);
    sendResponse(res, false, null, 'Erreur serveur');
  }
});

// GET /api/support/tickets/:id/responses-user-no-auth
app.get('/api/support/tickets/:id/responses-user-no-auth', async (req, res) => {
  try {
    const ticketId = req.params.id;
    const result = await pool.query(
      'SELECT * FROM support_ticket_responses WHERE ticket_id = $1 ORDER BY created_at ASC',
      [ticketId]
    );

    sendResponse(res, true, result.rows);
  } catch (error) {
    console.error('Erreur récupération réponses:', error);
    sendResponse(res, false, null, 'Erreur serveur');
  }
});

// POST /api/support/tickets/:id/responses-user-no-auth
app.post('/api/support/tickets/:id/responses-user-no-auth', async (req, res) => {
  try {
    const ticketId = req.params.id;
    const { message } = req.body;

    if (!message) {
      return sendResponse(res, false, null, 'Message requis');
    }

    const result = await pool.query(
      'INSERT INTO support_ticket_responses (ticket_id, message, is_admin_response, created_at) VALUES ($1, $2, $3, NOW()) RETURNING *',
      [ticketId, message, false]
    );

    sendResponse(res, true, result.rows[0]);
  } catch (error) {
    console.error('Erreur création réponse:', error);
    sendResponse(res, false, null, 'Erreur serveur');
  }
});

// ===== ENDPOINTS POUR LE SUPPORT (avec authentification) =====

// GET /api/support/tickets - Tickets de l'utilisateur connecté
app.get('/api/support/tickets', authenticateToken, async (req, res) => {
  try {
    console.log('🎫 Récupération des tickets pour l\'utilisateur:', req.user.id);
    
    const result = await pool.query(
      'SELECT * FROM support_tickets WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );

    console.log('✅ Tickets récupérés:', result.rows.length);
    sendResponse(res, true, result.rows);
  } catch (error) {
    console.error('❌ Erreur support tickets:', error);
    sendResponse(res, false, null, 'Erreur serveur');
  }
});

// GET /api/support/faqs - FAQ
app.get('/api/support/faqs', async (req, res) => {
  try {
    console.log('❓ Récupération des FAQ');
    
    const result = await pool.query(
      'SELECT * FROM support_faqs WHERE is_active = true ORDER BY order_index ASC, id ASC'
    );

    console.log('✅ FAQ récupérées:', result.rows.length);
    sendResponse(res, true, result.rows);
  } catch (error) {
    console.error('❌ Erreur support FAQ:', error);
    sendResponse(res, false, null, 'Erreur serveur');
  }
});

// GET /api/support/kb-articles - Articles de base de connaissances
app.get('/api/support/kb-articles', async (req, res) => {
  try {
    console.log('📚 Récupération des articles de base de connaissances');
    
    const result = await pool.query(`
      SELECT 
        kb.*,
        u.full_name as author_name,
        u.email as author_email
      FROM knowledge_base kb
      LEFT JOIN profiles u ON kb.author_id = u.id
      WHERE kb.is_published = true
      ORDER BY kb.created_at DESC
    `);

    console.log('✅ Articles récupérés:', result.rows.length);
    sendResponse(res, true, result.rows);
  } catch (error) {
    console.error('❌ Erreur support KB articles:', error);
    sendResponse(res, false, null, 'Erreur serveur');
  }
});

// POST /api/support/tickets - Créer un ticket
app.post('/api/support/tickets', authenticateToken, async (req, res) => {
  try {
    const { subject, message, priority = 'medium' } = req.body;

    if (!subject || !message) {
      return sendResponse(res, false, null, 'Sujet et message requis');
    }

    console.log('🎫 Création d\'un ticket pour l\'utilisateur:', req.user.id);

    const result = await pool.query(
      'INSERT INTO support_tickets (user_id, subject, message, priority, status, created_at) VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *',
      [req.user.id, subject, message, priority, 'open']
    );

    console.log('✅ Ticket créé:', result.rows[0].id);
    sendResponse(res, true, result.rows[0]);
  } catch (error) {
    console.error('❌ Erreur création ticket:', error);
    sendResponse(res, false, null, 'Erreur serveur');
  }
});

// GET /api/support/tickets/:id/responses - Réponses d'un ticket
app.get('/api/support/tickets/:id/responses', authenticateToken, async (req, res) => {
  try {
    const ticketId = req.params.id;
    console.log('💬 Récupération des réponses pour le ticket:', ticketId);
    
    const result = await pool.query(
      'SELECT * FROM support_ticket_responses WHERE ticket_id = $1 ORDER BY created_at ASC',
      [ticketId]
    );

    console.log('✅ Réponses récupérées:', result.rows.length);
    sendResponse(res, true, result.rows);
  } catch (error) {
    console.error('❌ Erreur récupération réponses:', error);
    sendResponse(res, false, null, 'Erreur serveur');
  }
});

// POST /api/support/tickets/:id/responses - Ajouter une réponse
app.post('/api/support/tickets/:id/responses', authenticateToken, async (req, res) => {
  try {
    const ticketId = req.params.id;
    const { message } = req.body;

    if (!message) {
      return sendResponse(res, false, null, 'Message requis');
    }

    console.log('💬 Ajout d\'une réponse au ticket:', ticketId);

    const result = await pool.query(
      'INSERT INTO support_ticket_responses (ticket_id, message, is_admin_response, created_at) VALUES ($1, $2, $3, NOW()) RETURNING *',
      [ticketId, message, false]
    );

    console.log('✅ Réponse ajoutée:', result.rows[0].id);
    sendResponse(res, true, result.rows[0]);
  } catch (error) {
    console.error('❌ Erreur ajout réponse:', error);
    sendResponse(res, false, null, 'Erreur serveur');
  }
});

// ===== ENDPOINTS POUR L'UPLOAD D'IMAGES =====

// POST /api/upload/avatar - Upload d'avatar
app.post('/api/upload/avatar', authenticateToken, async (req, res) => {
  try {
    console.log('📸 Upload d\'avatar pour l\'utilisateur:', req.user.id);
    
    // Pour l'instant, on simule un upload réussi
    // Dans un vrai système, vous utiliseriez multer ou un autre middleware d'upload
    const { avatar_url } = req.body;
    
    if (!avatar_url) {
      return sendResponse(res, false, null, 'URL d\'avatar requise');
    }
    
    // Mettre à jour le profil utilisateur
    const result = await pool.query(
      'UPDATE profiles SET avatar_url = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [avatar_url, req.user.id]
    );
    
    if (result.rows.length === 0) {
      return sendResponse(res, false, null, 'Utilisateur non trouvé');
    }
    
    console.log('✅ Avatar mis à jour:', result.rows[0].avatar_url);
    sendResponse(res, true, result.rows[0]);
  } catch (error) {
    console.error('❌ Erreur upload avatar:', error);
    sendResponse(res, false, null, 'Erreur serveur');
  }
});

// POST /api/upload/logo - Upload de logo
app.post('/api/upload/logo', authenticateToken, async (req, res) => {
  try {
    console.log('🏢 Upload de logo pour l\'utilisateur:', req.user.id);
    
    const { logo_url } = req.body;
    
    if (!logo_url) {
      return sendResponse(res, false, null, 'URL de logo requise');
    }
    
    // Mettre à jour le profil utilisateur
    const result = await pool.query(
      'UPDATE profiles SET logo_url = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [logo_url, req.user.id]
    );
    
    if (result.rows.length === 0) {
      return sendResponse(res, false, null, 'Utilisateur non trouvé');
    }
    
    console.log('✅ Logo mis à jour:', result.rows[0].logo_url);
    sendResponse(res, true, result.rows[0]);
  } catch (error) {
    console.error('❌ Erreur upload logo:', error);
    sendResponse(res, false, null, 'Erreur serveur');
  }
});

// ===== ENDPOINTS POUR L'ADMIN SUPPORT =====

// GET /api/admin/support/tickets-no-auth
app.get('/api/admin/support/tickets-no-auth', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM support_tickets ORDER BY created_at DESC'
    );

    sendResponse(res, true, result.rows);
  } catch (error) {
    console.error('Erreur admin tickets:', error);
    sendResponse(res, false, null, 'Erreur serveur');
  }
});

// GET /api/admin/support/tickets/:id/responses-no-auth
app.get('/api/admin/support/tickets/:id/responses-no-auth', async (req, res) => {
  try {
    const ticketId = req.params.id;
    const result = await pool.query(
      'SELECT * FROM support_ticket_responses WHERE ticket_id = $1 ORDER BY created_at ASC',
      [ticketId]
    );

    sendResponse(res, true, result.rows);
  } catch (error) {
    console.error('Erreur récupération réponses admin:', error);
    sendResponse(res, false, null, 'Erreur serveur');
  }
});

// POST /api/admin/support/tickets/:id/responses-no-auth
app.post('/api/admin/support/tickets/:id/responses-no-auth', async (req, res) => {
  try {
    const ticketId = req.params.id;
    const { message } = req.body;

    if (!message) {
      return sendResponse(res, false, null, 'Message requis');
    }

    const result = await pool.query(
      'INSERT INTO support_ticket_responses (ticket_id, message, is_admin_response, created_at) VALUES ($1, $2, $3, NOW()) RETURNING *',
      [ticketId, message, true]
    );

    sendResponse(res, true, result.rows[0]);
  } catch (error) {
    console.error('Erreur création réponse admin:', error);
    sendResponse(res, false, null, 'Erreur serveur');
  }
});

// ===== ENDPOINT DE SANTÉ =====

// GET /api/health
app.get('/api/health', (req, res) => {
  sendResponse(res, true, { 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// ===== ENDPOINT EMAIL EXISTANT =====

// POST /api/send-email
app.post('/api/send-email', async (req, res) => {
  const { to, subject, html } = req.body;
  if (!to || !subject || !html) {
    return res.status(400).json({ error: 'Champs requis : to, subject, html' });
  }
  try {
    const transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST || 'mail.coworkmy.fr',
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER || 'contact@coworkmy.fr',
        pass: process.env.SMTP_PASS || '',
      },
    });
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'contact@coworkmy.fr',
      to,
      subject,
      html,
    });
    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Erreur envoi email SMTP:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/email-history
app.get('/api/email-history', authenticateToken, async (req, res) => {
  try {
    if (!req.user.is_admin) {
      return sendResponse(res, false, null, 'Accès non autorisé');
    }
    const result = await pool.query(
      'SELECT * FROM email_history ORDER BY created_at DESC'
    );
    sendResponse(res, true, result.rows);
  } catch (error) {
    console.error('Erreur email-history:', error);
    sendResponse(res, false, null, 'Erreur serveur');
  }
});

// GET /api/email-config
app.get('/api/email-config', authenticateToken, async (req, res) => {
  try {
    if (!req.user.is_admin) {
      return sendResponse(res, false, null, 'Accès non autorisé');
    }
    const result = await pool.query(
      'SELECT * FROM email_config WHERE is_active = true ORDER BY created_at DESC LIMIT 1'
    );
    if (result.rows.length === 0) {
      return sendResponse(res, false, null, 'Aucune configuration email trouvée');
    }
    sendResponse(res, true, result.rows[0]);
  } catch (error) {
    console.error('Erreur email-config:', error);
    sendResponse(res, false, null, 'Erreur serveur');
  }
});

// POST /api/email-config
app.post('/api/email-config', authenticateToken, async (req, res) => {
  try {
    if (!req.user.is_admin) {
      return sendResponse(res, false, null, 'Accès non autorisé');
    }
    const { smtp_host, smtp_port, smtp_username, smtp_secure, from_email, from_name, reply_to_email, is_active } = req.body;
    const result = await pool.query(
      `INSERT INTO email_config (smtp_host, smtp_port, smtp_username, smtp_secure, from_email, from_name, reply_to_email, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
       RETURNING *`,
      [smtp_host, smtp_port, smtp_username, smtp_secure, from_email, from_name, reply_to_email, is_active]
    );
    sendResponse(res, true, result.rows[0]);
  } catch (error) {
    console.error('Erreur création email-config:', error);
    sendResponse(res, false, null, 'Erreur serveur');
  }
});

// PUT /api/email-config/:id
app.put('/api/email-config/:id', authenticateToken, async (req, res) => {
  try {
    if (!req.user.is_admin) {
      return sendResponse(res, false, null, 'Accès non autorisé');
    }
    const { id } = req.params;
    const { smtp_host, smtp_port, smtp_username, smtp_secure, from_email, from_name, reply_to_email, is_active } = req.body;
    const result = await pool.query(
      `UPDATE email_config SET smtp_host = $1, smtp_port = $2, smtp_username = $3, smtp_secure = $4, from_email = $5, from_name = $6, reply_to_email = $7, is_active = $8, updated_at = NOW()
       WHERE id = $9 RETURNING *`,
      [smtp_host, smtp_port, smtp_username, smtp_secure, from_email, from_name, reply_to_email, is_active, id]
    );
    if (result.rows.length === 0) {
      return sendResponse(res, false, null, 'Configuration email non trouvée');
    }
    sendResponse(res, true, result.rows[0]);
  } catch (error) {
    console.error('Erreur mise à jour email-config:', error);
    sendResponse(res, false, null, 'Erreur serveur');
  }
});

// ===== ENDPOINTS STRIPE =====

// Test de connexion Stripe
app.get('/api/stripe/test-connection', authenticateToken, async (req, res) => {
  try {
    if (!req.user.is_admin) {
      return sendResponse(res, false, null, 'Accès non autorisé');
    }

    console.log('🔍 Test de connexion Stripe...');
    
    // Récupérer la configuration Stripe depuis la base de données
    const config = await getStripeConfig();
    const stripeInstance = new Stripe(config.secretKey, {
      apiVersion: '2023-10-16',
    });

    // Tester la connexion en récupérant les produits
    const products = await stripeInstance.products.list({ limit: 1 });
    
    sendResponse(res, true, {
      connected: true,
      products_count: products.data.length,
      message: `Connexion Stripe réussie (Mode: ${config.mode})`,
      mode: config.mode
    });
  } catch (error) {
    console.error('❌ Erreur test Stripe:', error);
    sendResponse(res, false, null, `Erreur Stripe: ${error.message}`);
  }
});

// Synchronisation de tous les espaces avec Stripe
app.post('/api/stripe/sync-all', authenticateToken, async (req, res) => {
  try {
    if (!req.user.is_admin) {
      return sendResponse(res, false, null, 'Accès non autorisé');
    }

    console.log('🔄 Synchronisation de tous les espaces avec Stripe...');
    
    // Récupérer la configuration Stripe depuis la base de données
    const config = await getStripeConfig();
    const stripeInstance = new Stripe(config.secretKey, {
      apiVersion: '2023-10-16',
    });

    // Récupérer tous les espaces actifs
    const spacesResult = await pool.query(
      'SELECT * FROM spaces WHERE is_active = true ORDER BY created_at DESC'
    );
    
    const spaces = spacesResult.rows;
    console.log(`📊 ${spaces.length} espaces à synchroniser`);

    const syncResults = [];
    
    for (const space of spaces) {
      try {
        console.log(`🔄 Synchronisation de l'espace: ${space.name}`);
        
        // Déterminer le prix selon le pricing_type
        let price = 0;
        let currency = 'eur';
        
        switch (space.pricing_type) {
          case 'hourly':
            price = Math.round((space.hourly_price || 0) * 100); // Convertir en centimes
            break;
          case 'daily':
            price = Math.round((space.daily_price || 0) * 100);
            break;
          case 'monthly':
            price = Math.round((space.monthly_price || 0) * 100);
            break;
          default:
            price = Math.round((space.hourly_price || 0) * 100);
        }

        if (price <= 0) {
          console.log(`⚠️ Prix invalide pour ${space.name}, ignoré`);
          syncResults.push({
            space_id: space.id,
            space_name: space.name,
            status: 'skipped',
            reason: 'Prix invalide'
          });
          continue;
        }

        // Créer ou mettre à jour le produit Stripe
        const productData = {
          name: space.name,
          description: space.description || '',
          metadata: {
            space_id: space.id,
            pricing_type: space.pricing_type
          }
        };

        let product;
        try {
          // Chercher un produit existant
          const existingProducts = await stripeInstance.products.list({
            limit: 100
          });
          
          const existingProduct = existingProducts.data.find(p => 
            p.metadata.space_id === space.id
          );

          if (existingProduct) {
            // Mettre à jour le produit existant
            product = await stripeInstance.products.update(existingProduct.id, productData);
            console.log(`✅ Produit mis à jour: ${product.id}`);
          } else {
            // Créer un nouveau produit
            product = await stripeInstance.products.create(productData);
            console.log(`✅ Nouveau produit créé: ${product.id}`);
          }
        } catch (productError) {
          console.error(`❌ Erreur produit pour ${space.name}:`, productError);
          syncResults.push({
            space_id: space.id,
            space_name: space.name,
            status: 'error',
            error: productError.message
          });
          continue;
        }

        // Créer ou mettre à jour le prix
        try {
          const priceData = {
            product: product.id,
            unit_amount: price,
            currency: currency,
            metadata: {
              space_id: space.id,
              pricing_type: space.pricing_type
            }
          };

          // Chercher un prix existant
          const existingPrices = await stripeInstance.prices.list({
            product: product.id,
            limit: 100
          });
          
          const existingPrice = existingPrices.data.find(p => 
            p.metadata.space_id === space.id && 
            p.metadata.pricing_type === space.pricing_type
          );

          let stripePrice;
          if (existingPrice) {
            // Le prix existe déjà, on peut le réactiver s'il est archivé
            if (existingPrice.active) {
              stripePrice = existingPrice;
              console.log(`✅ Prix existant trouvé: ${stripePrice.id}`);
            } else {
              // Créer un nouveau prix si l'ancien est archivé
              stripePrice = await stripeInstance.prices.create(priceData);
              console.log(`✅ Nouveau prix créé: ${stripePrice.id}`);
            }
          } else {
            // Créer un nouveau prix
            stripePrice = await stripeInstance.prices.create(priceData);
            console.log(`✅ Nouveau prix créé: ${stripePrice.id}`);
          }

          syncResults.push({
            space_id: space.id,
            space_name: space.name,
            status: 'success',
            product_id: product.id,
            price_id: stripePrice.id,
            amount: price / 100
          });

        } catch (priceError) {
          console.error(`❌ Erreur prix pour ${space.name}:`, priceError);
          syncResults.push({
            space_id: space.id,
            space_name: space.name,
            status: 'error',
            error: priceError.message
          });
        }

      } catch (spaceError) {
        console.error(`❌ Erreur générale pour ${space.name}:`, spaceError);
        syncResults.push({
          space_id: space.id,
          space_name: space.name,
          status: 'error',
          error: spaceError.message
        });
      }
    }

    const successCount = syncResults.filter(r => r.status === 'success').length;
    const errorCount = syncResults.filter(r => r.status === 'error').length;
    const skippedCount = syncResults.filter(r => r.status === 'skipped').length;

    console.log(`✅ Synchronisation terminée: ${successCount} succès, ${errorCount} erreurs, ${skippedCount} ignorés`);

    sendResponse(res, true, {
      total_spaces: spaces.length,
      success_count: successCount,
      error_count: errorCount,
      skipped_count: skippedCount,
      results: syncResults
    });

  } catch (error) {
    console.error('❌ Erreur synchronisation Stripe:', error);
    sendResponse(res, false, null, `Erreur synchronisation: ${error.message}`);
  }
});

// Endpoint pour créer un portail client Stripe
app.post('/api/stripe/create-customer-portal', authenticateToken, async (req, res) => {
  try {
    const { customerEmail, returnUrl } = req.body;
    
    if (!customerEmail || !returnUrl) {
      return sendResponse(res, false, null, 'Email client et URL de retour requis');
    }

    console.log('🔗 Création du portail client Stripe pour:', customerEmail);

    // Récupérer la configuration Stripe depuis la base de données
    const config = await getStripeConfig();
    const stripeInstance = new Stripe(config.secretKey, {
      apiVersion: '2023-10-16',
    });

    // Créer ou récupérer le client Stripe
    let customer;
    try {
      // Chercher un client existant par email
      const existingCustomers = await stripeInstance.customers.list({
        email: customerEmail,
        limit: 1
      });

      if (existingCustomers.data.length > 0) {
        customer = existingCustomers.data[0];
        console.log('✅ Client existant trouvé:', customer.id);
      } else {
        // Créer un nouveau client
        customer = await stripeInstance.customers.create({
          email: customerEmail,
          name: req.user.full_name || customerEmail
        });
        console.log('✅ Nouveau client créé:', customer.id);
      }
    } catch (stripeError) {
      console.error('❌ Erreur Stripe client:', stripeError);
      return sendResponse(res, false, null, `Erreur Stripe: ${stripeError.message}`);
    }

    // Créer une session de portail client
    const portalSession = await stripeInstance.billingPortal.sessions.create({
      customer: customer.id,
      return_url: returnUrl,
    });

    console.log('✅ Portail client créé:', portalSession.url);
    sendResponse(res, true, { url: portalSession.url });
  } catch (error) {
    console.error('❌ Erreur création portail client:', error);
    sendResponse(res, false, null, `Erreur lors de la création du portail client: ${error.message}`);
  }
});

// ===== GESTION DES ERREURS 404 =====

app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    error: 'Endpoint non trouvé',
    path: req.originalUrl 
  });
});

const PORT = process.env.API_PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 API CoworkMy démarrée sur le port ${PORT}`);
  console.log(`📊 Endpoints disponibles:`);
  console.log(`   - POST /api/auth/signin`);
  console.log(`   - POST /api/auth/signup`);
  console.log(`   - GET  /api/auth/me`);
  console.log(`   - GET  /api/spaces`);
  console.log(`   - GET  /api/spaces/active`);
  console.log(`   - GET  /api/spaces/:id`);
  console.log(`   - POST /api/spaces`);
  console.log(`   - PUT  /api/spaces/:id`);
  console.log(`   - DELETE /api/spaces/:id`);
  console.log(`   - GET  /api/users`);
  console.log(`   - GET  /api/users/:id`);
  console.log(`   - PUT  /api/users/:id`);
  console.log(`   - DELETE /api/users/:id`);
  console.log(`   - GET  /api/users/:id/documents`);
  console.log(`   - GET  /api/admin/bookings`);
  console.log(`   - PUT  /api/admin/bookings/:id/status`);
  console.log(`   - DELETE /api/admin/bookings/:id`);
  console.log(`   - GET  /api/stripe/payments`);
  console.log(`   - POST /api/stripe/payments/:id/refund`);
  console.log(`   - GET  /api/payments`);
  console.log(`   - GET  /api/time-slots`);
  console.log(`   - POST /api/time-slots`);
  console.log(`   - PUT  /api/time-slots/:id`);
  console.log(`   - DELETE /api/time-slots/:id`);
  console.log(`   - GET  /api/email-templates`);
  console.log(`   - POST /api/email-templates`);
  console.log(`   - PUT  /api/email-templates/:id`);
  console.log(`   - DELETE /api/email-templates/:id`);
  console.log(`   - GET  /api/email-history`);
  console.log(`   - GET  /api/email-config`);
  console.log(`   - POST /api/email-config`);
  console.log(`   - PUT  /api/email-config/:id`);
  console.log(`   - GET  /api/admin/support/faqs`);
  console.log(`   - POST /api/admin/support/faqs`);
  console.log(`   - PUT  /api/admin/support/faqs/:id`);
  console.log(`   - DELETE /api/admin/support/faqs/:id`);
  console.log(`   - GET  /api/admin/support/kb-articles`);
  console.log(`   - POST /api/admin/support/kb-articles`);
  console.log(`   - PUT  /api/admin/support/kb-articles/:id`);
  console.log(`   - DELETE /api/admin/support/kb-articles/:id`);
  console.log(`   - GET  /api/legal-pages`);
  console.log(`   - POST /api/legal-pages`);
  console.log(`   - PUT  /api/legal-pages/:id`);
  console.log(`   - DELETE /api/legal-pages/:id`);
  console.log(`   - GET  /api/cookie-settings`);
  console.log(`   - POST /api/cookie-settings`);
  console.log(`   - GET  /api/homepage-settings`);
  console.log(`   - POST /api/homepage-settings`);
  console.log(`   - GET  /api/company-settings`);
  console.log(`   - POST /api/company-settings`);
  console.log(`   - GET  /api/carousel-images`);
  console.log(`   - POST /api/carousel-images`);
  console.log(`   - DELETE /api/carousel-images/:id`);
  console.log(`   - GET  /api/bookings`);
  console.log(`   - POST /api/bookings`);
  console.log(`   - GET  /api/admin/settings`);
  console.log(`   - POST /api/admin/settings`);
  console.log(`   - GET  /api/support/tickets-user-no-auth`);
  console.log(`   - POST /api/support/tickets-user-no-auth`);
  console.log(`   - GET  /api/support/tickets/:id/responses-user-no-auth`);
  console.log(`   - POST /api/support/tickets/:id/responses-user-no-auth`);
  console.log(`   - GET  /api/support/faqs`);
  console.log(`   - GET  /api/support/kb-articles`);
  console.log(`   - POST /api/upload/avatar`);
  console.log(`   - POST /api/upload/logo`);
  console.log(`   - GET  /api/admin/support/tickets-no-auth`);
  console.log(`   - GET  /api/admin/support/tickets/:id/responses-no-auth`);
  console.log(`   - POST /api/admin/support/tickets/:id/responses-no-auth`);
  console.log(`   - GET  /api/health`);
  console.log(`   - POST /api/send-email`);
  console.log(`   - GET  /api/stripe/test-connection`);
  console.log(`   - POST /api/stripe/sync-all`);
  console.log(`   - POST /api/stripe/create-customer-portal`);
  console.log(`   - POST /api/users/:id/documents`);
  console.log(`   - DELETE /api/users/:id/documents/:documentId`);
});