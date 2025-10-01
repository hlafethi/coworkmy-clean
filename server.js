import express from 'express';
import nodemailer from 'nodemailer';
import cors from 'cors';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

dotenv.config();

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

    // Compte de test pour le développement
    const testUser = {
      id: 1,
      email: 'admin@coworkmy.fr',
      password: 'Project@2025*',
      full_name: 'Administrateur',
      is_admin: true
    };

    // Vérification des identifiants de test
    if (email === testUser.email && password === testUser.password) {
      // Génération du token JWT
      const token = jwt.sign(
        { 
          id: testUser.id, 
          email: testUser.email,
          is_admin: testUser.is_admin
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      return sendResponse(res, true, {
        user: {
          id: testUser.id,
          email: testUser.email,
          full_name: testUser.full_name,
          is_admin: testUser.is_admin
        },
        token
      });
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

// GET /api/users/:id
app.get('/api/users/:id', authenticateToken, async (req, res) => {
  try {
    // Vérifier que l'utilisateur est admin
    if (!req.user.is_admin) {
      return sendResponse(res, false, null, 'Accès non autorisé');
    }

    const userId = req.params.id;
    const result = await pool.query(
      'SELECT id, email, full_name, first_name, last_name, phone, company, city, is_admin, created_at, updated_at FROM profiles WHERE id = $1',
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

// GET /api/users/:id/documents
app.get('/api/users/:id/documents', authenticateToken, async (req, res) => {
  try {
    // Vérifier que l'utilisateur est admin
    if (!req.user.is_admin) {
      return sendResponse(res, false, null, 'Accès non autorisé');
    }

    const userId = req.params.id;
    
    // Vérifier d'abord si l'utilisateur existe
    const userCheck = await pool.query('SELECT id FROM profiles WHERE id = $1', [userId]);
    if (userCheck.rows.length === 0) {
      return sendResponse(res, false, null, 'Utilisateur non trouvé');
    }

    // Récupérer les documents de l'utilisateur
    // Note: Si la table profile_documents n'existe pas, on retourne une liste vide
    try {
      const result = await pool.query(
        'SELECT id, file_name, file_type, file_size, upload_date, file_path FROM profile_documents WHERE user_id = $1 ORDER BY upload_date DESC',
        [userId]
      );
      
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

// PUT /api/users/:id
app.put('/api/users/:id', authenticateToken, async (req, res) => {
  try {
    // Vérifier que l'utilisateur est admin
    if (!req.user.is_admin) {
      return sendResponse(res, false, null, 'Accès non autorisé');
    }

    const userId = req.params.id;
    const { email, full_name, first_name, last_name, phone, company, city, is_admin } = req.body;

    // Vérifier que l'utilisateur existe
    const userCheck = await pool.query('SELECT id FROM profiles WHERE id = $1', [userId]);
    if (userCheck.rows.length === 0) {
      return sendResponse(res, false, null, 'Utilisateur non trouvé');
    }

    // Mettre à jour l'utilisateur
    const result = await pool.query(
      `UPDATE profiles 
       SET email = $1, full_name = $2, first_name = $3, last_name = $4, 
           phone = $5, company = $6, city = $7, is_admin = $8, updated_at = NOW()
       WHERE id = $9 
       RETURNING id, email, full_name, first_name, last_name, phone, company, city, is_admin, created_at, updated_at`,
      [email, full_name, first_name, last_name, phone, company, city, is_admin, userId]
    );

    sendResponse(res, true, result.rows[0]);
  } catch (error) {
    console.error('Erreur update user:', error);
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

// GET /api/admin/bookings
app.get('/api/admin/bookings', authenticateToken, async (req, res) => {
  try {
    // Vérifier que l'utilisateur est admin
    if (!req.user.is_admin) {
      return sendResponse(res, false, null, 'Accès non autorisé');
    }

    console.log('📅 Récupération des réservations admin...');
    
    // Récupérer toutes les réservations avec les informations utilisateur et espace
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
    console.log('❓ Récupération des FAQ...');
    
    // Récupérer les FAQ
    const result = await pool.query(`
      SELECT 
        f.*,
        u.email as author_email,
        u.full_name as author_name
      FROM faqs f
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
      `INSERT INTO faqs (question, answer, category, order_index, is_active, author_id, created_at, updated_at)
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
      `UPDATE faqs 
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
    
    const result = await pool.query('DELETE FROM faqs WHERE id = $1 RETURNING *', [id]);
    
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

    const { title, content, category, tags, is_published } = req.body;
    
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
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur récupération bookings:', error);
      return sendResponse(res, false, null, 'Erreur lors de la récupération des réservations');
    }

    sendResponse(res, true, bookings || []);
  } catch (error) {
    console.error('Erreur bookings:', error);
    sendResponse(res, false, null, 'Erreur serveur');
  }
});

// POST /api/bookings
app.post('/api/bookings', authenticateToken, async (req, res) => {
  try {
    const { space_id, start_date, end_date, notes } = req.body;

    if (!space_id || !start_date || !end_date) {
      return sendResponse(res, false, null, 'Données de réservation incomplètes');
    }

    const { data: booking, error } = await supabase
      .from('bookings')
      .insert({
        user_id: req.user.id,
        space_id,
        start_date,
        end_date,
        notes: notes || null,
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      console.error('Erreur création booking:', error);
      return sendResponse(res, false, null, 'Erreur lors de la création de la réservation');
    }

    sendResponse(res, true, booking);
  } catch (error) {
    console.error('Erreur create booking:', error);
    sendResponse(res, false, null, 'Erreur serveur');
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
  console.log(`   - GET  /api/admin/support/tickets-no-auth`);
  console.log(`   - GET  /api/admin/support/tickets/:id/responses-no-auth`);
  console.log(`   - POST /api/admin/support/tickets/:id/responses-no-auth`);
  console.log(`   - GET  /api/health`);
  console.log(`   - POST /api/send-email`);
});