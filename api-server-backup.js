import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.API_PORT || 5000;

// Configuration PostgreSQL
const pool = new Pool({
  host: '147.93.58.155',
  port: 5432,
  database: 'coworkmy',
  user: 'vpshostinger',
  password: 'Fethi@2025!',
  ssl: false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Middleware
app.use(cors());
app.use(express.json());

// JWT Secret (en production, utilisez une variable d'environnement)
const JWT_SECRET = process.env.JWT_SECRET || 'coworkmy-secret-key-2025';

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

// Routes d'authentification
app.post('/api/auth/signin', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis' });
    }

    // Récupérer l'utilisateur
    const result = await pool.query(
      'SELECT * FROM profiles WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Utilisateur non trouvé' });
    }

    const user = result.rows[0];

    // Pour la démo, on accepte n'importe quel mot de passe
    // En production, vérifiez le hash du mot de passe
    // const validPassword = await bcrypt.compare(password, user.password_hash);
    // if (!validPassword) {
    //   return res.status(401).json({ error: 'Mot de passe incorrect' });
    // }

    // Générer le token JWT
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        is_admin: user.is_admin 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          avatar_url: user.avatar_url,
          city: user.city,
          is_admin: user.is_admin,
          created_at: user.created_at,
          updated_at: user.updated_at
        },
        token
      }
    });

  } catch (error) {
    console.error('Erreur de connexion:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password, full_name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email et mot de passe requis' });
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await pool.query(
      'SELECT * FROM profiles WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ success: false, error: 'Un utilisateur avec cet email existe déjà' });
    }

    // Hasher le mot de passe (optionnel pour la démo)
    // const hashedPassword = await bcrypt.hash(password, 10);

    // Créer l'utilisateur
    const result = await pool.query(
      `INSERT INTO profiles (email, full_name, is_admin) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [email, full_name || '', false]
    );

    const user = result.rows[0];

    // Générer le token JWT
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        is_admin: user.is_admin 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          avatar_url: user.avatar_url,
          city: user.city,
          is_admin: user.is_admin,
          created_at: user.created_at,
          updated_at: user.updated_at
        },
        token
      }
    });

  } catch (error) {
    console.error('Erreur d\'inscription:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

// Route pour vérifier le token
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM profiles WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    const user = result.rows[0];
    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          avatar_url: user.avatar_url,
          city: user.city,
          is_admin: user.is_admin,
          created_at: user.created_at,
          updated_at: user.updated_at
        }
      }
    });

  } catch (error) {
    console.error('Erreur de vérification:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Routes pour les espaces
app.get('/api/spaces', async (req, res) => {
  try {
    console.log('🔍 GET /api/spaces - Récupération des espaces...');
    const result = await pool.query(
      'SELECT * FROM spaces WHERE is_active = true ORDER BY created_at DESC'
    );
    console.log(`✅ ${result.rows.length} espaces trouvés`);
    
    // Mapper les données pour le frontend
    const mappedSpaces = result.rows.map(space => ({
      id: space.id,
      name: space.name,
      description: space.description,
      capacity: space.capacity,
      hourly_price: parseFloat(space.price_per_hour),
      daily_price: parseFloat(space.price_per_day),
      half_day_price: parseFloat(space.price_per_half_day),
      monthly_price: parseFloat(space.price_per_month || 0),
      quarter_price: parseFloat(space.price_per_quarter || 0),
      yearly_price: parseFloat(space.price_per_year || 0),
      custom_price: parseFloat(space.custom_price || 0),
      custom_label: space.custom_label || '',
      pricing_type: space.pricing_type || 'hourly',
      amenities: space.amenities || [],
      image_url: space.image_url,
      is_active: space.is_active,
      created_at: space.created_at,
      updated_at: space.updated_at
    }));
    
    console.log('📊 Espaces mappés pour le frontend:', mappedSpaces.length);
    res.json({ success: true, data: mappedSpaces });
  } catch (error) {
    console.error('❌ Erreur récupération espaces:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

// Récupérer un espace spécifique
app.get('/api/spaces/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🔍 GET /api/spaces/${id} - Récupération de l'espace...`);
    
    const result = await pool.query(
      'SELECT * FROM spaces WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      console.log(`❌ Espace ${id} non trouvé`);
      return res.status(404).json({ success: false, error: 'Espace non trouvé' });
    }
    
    console.log(`✅ Espace ${id} trouvé`);
    
    // Mapper les données pour le frontend
    const space = result.rows[0];
    const mappedData = {
      id: space.id,
      name: space.name,
      description: space.description,
      capacity: space.capacity,
      hourly_price: parseFloat(space.price_per_hour),
      daily_price: parseFloat(space.price_per_day),
      half_day_price: parseFloat(space.price_per_half_day),
      monthly_price: parseFloat(space.price_per_month || 0),
      quarter_price: parseFloat(space.price_per_quarter || 0),
      yearly_price: parseFloat(space.price_per_year || 0),
      custom_price: parseFloat(space.custom_price || 0),
      custom_label: space.custom_label || '',
      pricing_type: space.pricing_type || 'hourly',
      amenities: space.amenities || [],
      image_url: space.image_url,
      is_active: space.is_active,
      created_at: space.created_at,
      updated_at: space.updated_at
    };
    
    res.json({ success: true, data: mappedData });
  } catch (error) {
    console.error('❌ Erreur récupération espace:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

app.post('/api/spaces', (req, res) => {
  console.log('🔍 POST /api/spaces - REQUÊTE REÇUE !');
  console.log('🔍 Headers:', req.headers);
  console.log('🔍 Body:', req.body);
  console.log('🔍 Auth header:', req.headers.authorization);
  
  // Vérifier l'authentification manuellement
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('❌ Pas de token d\'authentification');
    return res.status(401).json({ error: 'Token manquant' });
  }
  
  const token = authHeader.substring(7);
  console.log('🔍 Token reçu:', token.substring(0, 20) + '...');
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    console.log('✅ Token valide, user:', decoded.id);
    req.user = decoded;
  } catch (error) {
    console.log('❌ Token invalide:', error.message);
    return res.status(401).json({ error: 'Token invalide' });
  }
  
  // Continuer avec la logique de création d'espace
  (async () => {
    try {
      console.log('🔍 Début de la création d\'espace...');
    
    const { 
      name, 
      description, 
      capacity, 
      hourly_price, 
      daily_price, 
      half_day_price, 
      monthly_price, 
      quarter_price, 
      yearly_price, 
      custom_price, 
      custom_label, 
      pricing_type, 
      amenities, 
      image_url, 
      is_active,
      time_slots
    } = req.body;

    console.log('🔍 Valeurs extraites du body:', {
      name, description, capacity, hourly_price, daily_price, half_day_price, image_url, is_active
    });
    
    console.log('🔍 Détails de l\'image:', {
      image_url: image_url,
      type: typeof image_url,
      length: image_url ? image_url.length : 'null',
      isFile: image_url instanceof File,
      isString: typeof image_url === 'string'
    });
    
    console.log('🔍 Types des valeurs:', {
      name: typeof name,
      description: typeof description,
      capacity: typeof capacity,
      hourly_price: typeof hourly_price,
      daily_price: typeof daily_price,
      half_day_price: typeof half_day_price,
      image_url: typeof image_url,
      is_active: typeof is_active
    });

    console.log('🔍 Préparation de la requête SQL...');
    
    // Gestion spéciale de l'image
    let processedImageUrl = null;
    if (image_url && typeof image_url === 'string' && image_url.trim() !== '') {
      processedImageUrl = image_url;
      console.log('✅ Image URL valide:', processedImageUrl);
    } else {
      console.log('⚠️ Pas d\'image ou image invalide, utilisation de null');
      processedImageUrl = null;
    }
    
    console.log('🔍 Valeurs pour l\'insertion:', [name, description, capacity, hourly_price, daily_price, half_day_price, processedImageUrl, is_active || true]);
    
    const result = await pool.query(
      `INSERT INTO spaces (name, description, capacity, price_per_hour, price_per_day, price_per_half_day, image_url, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [name, description, capacity, hourly_price, daily_price, half_day_price, processedImageUrl, is_active || true]
    );
    
    console.log('✅ Requête SQL exécutée avec succès');
    console.log('🔍 Résultat:', result.rows[0]);

    console.log('✅ Espace créé avec succès:', result.rows[0]);
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('❌ ERREUR LORS DE LA CRÉATION D\'ESPACE !');
    console.error('❌ Type d\'erreur:', error.constructor.name);
    console.error('❌ Message d\'erreur:', error.message);
    console.error('❌ Code d\'erreur:', error.code);
    console.error('❌ Détails:', error.detail);
    console.error('❌ Stack trace complète:', error.stack);
    res.status(500).json({ success: false, error: 'Erreur serveur', details: error.message });
  }
  })();
});

app.put('/api/spaces/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🔍 PUT /api/spaces/${id} - Mise à jour de l'espace...`);
    console.log('📊 Données reçues:', req.body);
    
    const { 
      name, 
      description, 
      capacity, 
      hourly_price, 
      daily_price, 
      half_day_price, 
      image_url, 
      is_active 
    } = req.body;

    console.log('📊 Valeurs extraites:', {
      name, description, capacity, hourly_price, daily_price, half_day_price, image_url, is_active
    });

    const result = await pool.query(
      `UPDATE spaces 
       SET name = $1, description = $2, capacity = $3, price_per_hour = $4, 
           price_per_day = $5, price_per_half_day = $6, image_url = $7, is_active = $8
       WHERE id = $9
       RETURNING *`,
      [name, description, capacity, hourly_price, daily_price, half_day_price, image_url, is_active, id]
    );

    if (result.rows.length === 0) {
      console.log(`❌ Espace ${id} non trouvé`);
      return res.status(404).json({ success: false, error: 'Espace non trouvé' });
    }

    console.log(`✅ Espace ${id} mis à jour:`, result.rows[0]);
    
    // Mapper les données pour le frontend
    const mappedData = {
      id: result.rows[0].id,
      name: result.rows[0].name,
      description: result.rows[0].description,
      capacity: result.rows[0].capacity,
      hourly_price: parseFloat(result.rows[0].price_per_hour),
      daily_price: parseFloat(result.rows[0].price_per_day),
      half_day_price: parseFloat(result.rows[0].price_per_half_day),
      monthly_price: parseFloat(result.rows[0].price_per_month || 0),
      quarter_price: parseFloat(result.rows[0].price_per_quarter || 0),
      yearly_price: parseFloat(result.rows[0].price_per_year || 0),
      custom_price: parseFloat(result.rows[0].custom_price || 0),
      custom_label: result.rows[0].custom_label || '',
      pricing_type: result.rows[0].pricing_type || 'hourly',
      amenities: result.rows[0].amenities || [],
      image_url: result.rows[0].image_url,
      is_active: result.rows[0].is_active,
      created_at: result.rows[0].created_at,
      updated_at: result.rows[0].updated_at
    };
    
    console.log('📊 Données mappées pour le frontend:', mappedData);
    res.json({ success: true, data: mappedData });
  } catch (error) {
    console.error('❌ Erreur mise à jour espace:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

app.delete('/api/spaces/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('🔍 DELETE /api/spaces - Suppression espace:', id);
    
    const result = await pool.query(
      'DELETE FROM spaces WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Espace non trouvé' });
    }

    console.log('✅ Espace supprimé avec succès:', result.rows[0]);
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('❌ Erreur suppression espace:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

// Routes pour les réservations
app.get('/api/bookings', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 GET /api/bookings - Récupération des réservations...');
    console.log('👤 User ID:', req.user.id);
    
    const result = await pool.query(
      `SELECT b.*, s.name as space_name, s.description as space_description,
              p.full_name as user_name, p.email as user_email
       FROM bookings b
       JOIN spaces s ON b.space_id = s.id
       JOIN profiles p ON b.user_id = p.id
       WHERE b.user_id = $1
       ORDER BY b.created_at DESC`,
      [req.user.id]
    );
    
    console.log(`✅ ${result.rows.length} réservations trouvées`);
    console.log('📊 Données réservations:', result.rows);
    res.json({ 
      success: true, 
      data: result.rows 
    });
  } catch (error) {
    console.error('❌ Erreur récupération réservations:', error);
    console.error('❌ Détails erreur:', error.message);
    console.error('❌ Stack trace:', error.stack);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

// Endpoint admin pour récupérer TOUTES les réservations
app.get('/api/admin/bookings', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 GET /api/admin/bookings - Récupération de TOUTES les réservations...');
    console.log('👤 User ID:', req.user.id);
    
    // Vérifier si l'utilisateur est admin
    const userCheck = await pool.query(
      'SELECT is_admin FROM profiles WHERE id = $1',
      [req.user.id]
    );
    
    if (userCheck.rows.length === 0 || !userCheck.rows[0].is_admin) {
      console.log('❌ Utilisateur non autorisé (pas admin)');
      return res.status(403).json({ success: false, error: 'Accès non autorisé' });
    }
    
    const result = await pool.query(
      `SELECT b.*, s.name as space_name, s.description as space_description,
              p.full_name as user_name, p.email as user_email
       FROM bookings b
       JOIN spaces s ON b.space_id = s.id
       JOIN profiles p ON b.user_id = p.id
       ORDER BY b.created_at DESC`
    );
    
    console.log(`✅ ${result.rows.length} réservations trouvées pour l'admin`);
    console.log('📊 Données réservations admin:', result.rows);
    res.json({ 
      success: true, 
      data: result.rows 
    });
  } catch (error) {
    console.error('❌ Erreur récupération réservations admin:', error);
    console.error('❌ Détails erreur:', error.message);
    console.error('❌ Stack trace:', error.stack);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

// Endpoint admin pour mettre à jour le statut d'une réservation
app.put('/api/admin/bookings/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    console.log(`🔍 PUT /api/admin/bookings/${id}/status - Mise à jour du statut...`);
    console.log('👤 User ID:', req.user.id);
    console.log('📊 Nouveau statut:', status);
    
    // Vérifier si l'utilisateur est admin
    const userCheck = await pool.query(
      'SELECT is_admin FROM profiles WHERE id = $1',
      [req.user.id]
    );
    
    if (userCheck.rows.length === 0 || !userCheck.rows[0].is_admin) {
      console.log('❌ Utilisateur non autorisé (pas admin)');
      return res.status(403).json({ success: false, error: 'Accès non autorisé' });
    }
    
    const result = await pool.query(
      `UPDATE bookings 
       SET status = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [status, id]
    );

    if (result.rows.length === 0) {
      console.log(`❌ Réservation ${id} non trouvée`);
      return res.status(404).json({ success: false, error: 'Réservation non trouvée' });
    }

    console.log(`✅ Réservation ${id} mise à jour avec le statut ${status}:`, result.rows[0]);
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('❌ Erreur mise à jour statut réservation admin:', error);
    console.error('❌ Détails erreur:', error.message);
    console.error('❌ Stack trace:', error.stack);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

// Routes pour le système de support
app.get('/api/support/faqs', async (req, res) => {
  try {
    console.log('🔍 GET /api/support/faqs - Récupération des FAQ...');
    
    const result = await pool.query(
      `SELECT id, question, answer, category, order_index
       FROM support_faqs
       WHERE is_active = true
       ORDER BY order_index ASC, created_at ASC`
    );
    
    console.log(`✅ ${result.rows.length} FAQ trouvées`);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('❌ Erreur récupération FAQ:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

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

// Endpoint de chat supprimé

// Endpoint de chat supprimé

// Endpoint de chat supprimé

app.post('/api/support/chat/messages', authenticateToken, async (req, res) => {
  try {
    const { session_id, message, message_type = 'user' } = req.body;
    console.log('🔍 POST /api/support/chat/messages - Envoi d\'un message...');
    console.log('👤 User ID:', req.user.id);
    console.log('📊 Données:', { session_id, message, message_type });
    
    const result = await pool.query(
      `INSERT INTO support_chat_messages (session_id, user_id, message, message_type, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING *`,
      [session_id, req.user.id, message, message_type]
    );
    
    console.log(`✅ Message envoyé:`, result.rows[0]);
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('❌ Erreur envoi message chat:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
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

// Routes admin pour le support
app.get('/api/admin/support/tickets', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 GET /api/admin/support/tickets - Récupération des tickets admin...');
    console.log('👤 User ID:', req.user.id);
    
    // Vérifier si l'utilisateur est admin
    const userCheck = await pool.query(
      'SELECT is_admin FROM profiles WHERE id = $1',
      [req.user.id]
    );
    
    if (userCheck.rows.length === 0 || !userCheck.rows[0].is_admin) {
      console.log('❌ Utilisateur non autorisé (pas admin)');
      return res.status(403).json({ success: false, error: 'Accès non autorisé' });
    }
    
    const result = await pool.query(
      `SELECT st.*, p.full_name as user_name, p.email as user_email
       FROM support_tickets st
       JOIN profiles p ON st.user_id = p.id
       ORDER BY st.created_at DESC`
    );
    
    console.log(`✅ ${result.rows.length} tickets trouvés pour l'admin`);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('❌ Erreur récupération tickets admin:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

app.get('/api/admin/support/chat/users', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 GET /api/admin/support/chat/users - Récupération des utilisateurs chat...');
    console.log('👤 User ID:', req.user.id);
    
    // Vérifier si l'utilisateur est admin
    const userCheck = await pool.query(
      'SELECT is_admin FROM profiles WHERE id = $1',
      [req.user.id]
    );
    
    if (userCheck.rows.length === 0 || !userCheck.rows[0].is_admin) {
      console.log('❌ Utilisateur non autorisé (pas admin)');
      return res.status(403).json({ success: false, error: 'Accès non autorisé' });
    }
    
    const result = await pool.query(
      `SELECT DISTINCT p.id, p.full_name, p.email, p.avatar_url,
              MAX(scm.created_at) as last_message_at
       FROM profiles p
       JOIN support_chat_sessions scs ON p.id = scs.user_id
       JOIN support_chat_messages scm ON scs.id = scm.session_id
       GROUP BY p.id, p.full_name, p.email, p.avatar_url
       ORDER BY last_message_at DESC`
    );
    
    console.log(`✅ ${result.rows.length} utilisateurs chat trouvés`);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('❌ Erreur récupération utilisateurs chat:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

app.get('/api/admin/support/chat/sessions/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(`🔍 GET /api/admin/support/chat/sessions/${userId} - Récupération des sessions...`);
    console.log('👤 User ID:', req.user.id);
    
    // Vérifier si l'utilisateur est admin
    const userCheck = await pool.query(
      'SELECT is_admin FROM profiles WHERE id = $1',
      [req.user.id]
    );
    
    if (userCheck.rows.length === 0 || !userCheck.rows[0].is_admin) {
      console.log('❌ Utilisateur non autorisé (pas admin)');
      return res.status(403).json({ success: false, error: 'Accès non autorisé' });
    }
    
    const result = await pool.query(
      `SELECT * FROM support_chat_sessions
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );
    
    console.log(`✅ ${result.rows.length} sessions trouvées pour l'utilisateur ${userId}`);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('❌ Erreur récupération sessions chat admin:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

app.get('/api/admin/support/chat/sessions/:sessionId/messages', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    console.log(`🔍 GET /api/admin/support/chat/sessions/${sessionId}/messages - Récupération des messages...`);
    console.log('👤 User ID:', req.user.id);
    
    // Vérifier si l'utilisateur est admin
    const userCheck = await pool.query(
      'SELECT is_admin FROM profiles WHERE id = $1',
      [req.user.id]
    );
    
    if (userCheck.rows.length === 0 || !userCheck.rows[0].is_admin) {
      console.log('❌ Utilisateur non autorisé (pas admin)');
      return res.status(403).json({ success: false, error: 'Accès non autorisé' });
    }
    
    const result = await pool.query(
      `SELECT scm.*, p.full_name, p.email
       FROM support_chat_messages scm
       JOIN profiles p ON scm.user_id = p.id
       WHERE scm.session_id = $1
       ORDER BY scm.created_at ASC`,
      [sessionId]
    );
    
    console.log(`✅ ${result.rows.length} messages trouvés pour la session ${sessionId}`);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('❌ Erreur récupération messages chat admin:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

app.post('/api/admin/support/chat/messages', authenticateToken, async (req, res) => {
  try {
    const { session_id, message } = req.body;
    console.log('🔍 POST /api/admin/support/chat/messages - Envoi d\'un message admin...');
    console.log('👤 User ID:', req.user.id);
    console.log('📊 Données:', { session_id, message });
    
    // Vérifier si l'utilisateur est admin
    const userCheck = await pool.query(
      'SELECT is_admin FROM profiles WHERE id = $1',
      [req.user.id]
    );
    
    if (userCheck.rows.length === 0 || !userCheck.rows[0].is_admin) {
      console.log('❌ Utilisateur non autorisé (pas admin)');
      return res.status(403).json({ success: false, error: 'Accès non autorisé' });
    }
    
    const result = await pool.query(
      `INSERT INTO support_chat_messages (session_id, user_id, message, message_type, created_at)
       VALUES ($1, $2, $3, 'admin', NOW())
       RETURNING *`,
      [session_id, req.user.id, message]
    );
    
    console.log(`✅ Message admin envoyé:`, result.rows[0]);
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('❌ Erreur envoi message admin:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

app.get('/api/admin/support/faqs', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 GET /api/admin/support/faqs - Récupération des FAQ admin...');
    console.log('👤 User ID:', req.user.id);
    
    // Vérifier si l'utilisateur est admin
    const userCheck = await pool.query(
      'SELECT is_admin FROM profiles WHERE id = $1',
      [req.user.id]
    );
    
    if (userCheck.rows.length === 0 || !userCheck.rows[0].is_admin) {
      console.log('❌ Utilisateur non autorisé (pas admin)');
      return res.status(403).json({ success: false, error: 'Accès non autorisé' });
    }
    
    const result = await pool.query(
      `SELECT * FROM support_faqs
       ORDER BY order_index ASC, created_at ASC`
    );
    
    console.log(`✅ ${result.rows.length} FAQ trouvées pour l'admin`);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('❌ Erreur récupération FAQ admin:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

app.post('/api/admin/support/faqs', authenticateToken, async (req, res) => {
  try {
    const { question, answer, category, order_index, is_active } = req.body;
    console.log('🔍 POST /api/admin/support/faqs - Création d\'une FAQ...');
    console.log('👤 User ID:', req.user.id);
    console.log('📊 Données:', { question, answer, category, order_index, is_active });
    
    // Vérifier si l'utilisateur est admin
    const userCheck = await pool.query(
      'SELECT is_admin FROM profiles WHERE id = $1',
      [req.user.id]
    );
    
    if (userCheck.rows.length === 0 || !userCheck.rows[0].is_admin) {
      console.log('❌ Utilisateur non autorisé (pas admin)');
      return res.status(403).json({ success: false, error: 'Accès non autorisé' });
    }
    
    const result = await pool.query(
      `INSERT INTO support_faqs (question, answer, category, order_index, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
       RETURNING *`,
      [question, answer, category, order_index || 0, is_active !== false]
    );
    
    console.log(`✅ FAQ créée:`, result.rows[0]);
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('❌ Erreur création FAQ:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

app.put('/api/admin/support/faqs/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { question, answer, category, order_index, is_active } = req.body;
    console.log(`🔍 PUT /api/admin/support/faqs/${id} - Mise à jour d'une FAQ...`);
    console.log('👤 User ID:', req.user.id);
    console.log('📊 Données:', { question, answer, category, order_index, is_active });
    
    // Vérifier si l'utilisateur est admin
    const userCheck = await pool.query(
      'SELECT is_admin FROM profiles WHERE id = $1',
      [req.user.id]
    );
    
    if (userCheck.rows.length === 0 || !userCheck.rows[0].is_admin) {
      console.log('❌ Utilisateur non autorisé (pas admin)');
      return res.status(403).json({ success: false, error: 'Accès non autorisé' });
    }
    
    const result = await pool.query(
      `UPDATE support_faqs 
       SET question = $1, answer = $2, category = $3, order_index = $4, is_active = $5, updated_at = NOW()
       WHERE id = $6
       RETURNING *`,
      [question, answer, category, order_index || 0, is_active !== false, id]
    );
    
    if (result.rows.length === 0) {
      console.log(`❌ FAQ ${id} non trouvée`);
      return res.status(404).json({ success: false, error: 'FAQ non trouvée' });
    }
    
    console.log(`✅ FAQ ${id} mise à jour:`, result.rows[0]);
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('❌ Erreur mise à jour FAQ:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

app.delete('/api/admin/support/faqs/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🔍 DELETE /api/admin/support/faqs/${id} - Suppression d'une FAQ...`);
    console.log('👤 User ID:', req.user.id);
    
    // Vérifier si l'utilisateur est admin
    const userCheck = await pool.query(
      'SELECT is_admin FROM profiles WHERE id = $1',
      [req.user.id]
    );
    
    if (userCheck.rows.length === 0 || !userCheck.rows[0].is_admin) {
      console.log('❌ Utilisateur non autorisé (pas admin)');
      return res.status(403).json({ success: false, error: 'Accès non autorisé' });
    }
    
    const result = await pool.query(
      `DELETE FROM support_faqs WHERE id = $1 RETURNING *`,
      [id]
    );
    
    if (result.rows.length === 0) {
      console.log(`❌ FAQ ${id} non trouvée`);
      return res.status(404).json({ success: false, error: 'FAQ non trouvée' });
    }
    
    console.log(`✅ FAQ ${id} supprimée:`, result.rows[0]);
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('❌ Erreur suppression FAQ:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

// Routes admin pour la base de connaissances
app.get('/api/admin/support/kb/articles', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 GET /api/admin/support/kb/articles - Récupération des articles KB...');
    console.log('👤 User ID:', req.user.id);
    
    // Vérifier si l'utilisateur est admin
    const userCheck = await pool.query(
      'SELECT is_admin FROM profiles WHERE id = $1',
      [req.user.id]
    );
    
    if (userCheck.rows.length === 0 || !userCheck.rows[0].is_admin) {
      console.log('❌ Utilisateur non autorisé (pas admin)');
      return res.status(403).json({ success: false, error: 'Accès non autorisé' });
    }
    
    const result = await pool.query(
      `SELECT * FROM support_kb_articles
       ORDER BY order_index ASC, created_at ASC`
    );
    
    console.log(`✅ ${result.rows.length} articles KB trouvés pour l'admin`);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('❌ Erreur récupération articles KB admin:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

app.post('/api/admin/support/kb/articles', authenticateToken, async (req, res) => {
  try {
    const { title, content, category, order_index, is_active, image_url } = req.body;
    console.log('🔍 POST /api/admin/support/kb/articles - Création d\'un article KB...');
    console.log('👤 User ID:', req.user.id);
    console.log('📊 Données:', { title, content, category, order_index, is_active, image_url });
    
    // Vérifier si l'utilisateur est admin
    const userCheck = await pool.query(
      'SELECT is_admin FROM profiles WHERE id = $1',
      [req.user.id]
    );
    
    if (userCheck.rows.length === 0 || !userCheck.rows[0].is_admin) {
      console.log('❌ Utilisateur non autorisé (pas admin)');
      return res.status(403).json({ success: false, error: 'Accès non autorisé' });
    }
    
    const result = await pool.query(
      `INSERT INTO support_kb_articles (title, content, category, order_index, is_active, image_url, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       RETURNING *`,
      [title, content, category, order_index || 0, is_active !== false, image_url]
    );
    
    console.log(`✅ Article KB créé:`, result.rows[0]);
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('❌ Erreur création article KB:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

app.put('/api/admin/support/kb/articles/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, category, order_index, is_active, image_url } = req.body;
    console.log(`🔍 PUT /api/admin/support/kb/articles/${id} - Mise à jour d'un article KB...`);
    console.log('👤 User ID:', req.user.id);
    console.log('📊 Données:', { title, content, category, order_index, is_active, image_url });
    
    // Vérifier si l'utilisateur est admin
    const userCheck = await pool.query(
      'SELECT is_admin FROM profiles WHERE id = $1',
      [req.user.id]
    );
    
    if (userCheck.rows.length === 0 || !userCheck.rows[0].is_admin) {
      console.log('❌ Utilisateur non autorisé (pas admin)');
      return res.status(403).json({ success: false, error: 'Accès non autorisé' });
    }
    
    const result = await pool.query(
      `UPDATE support_kb_articles 
       SET title = $1, content = $2, category = $3, order_index = $4, is_active = $5, image_url = $6, updated_at = NOW()
       WHERE id = $7
       RETURNING *`,
      [title, content, category, order_index || 0, is_active !== false, image_url, id]
    );
    
    if (result.rows.length === 0) {
      console.log(`❌ Article KB ${id} non trouvé`);
      return res.status(404).json({ success: false, error: 'Article KB non trouvé' });
    }
    
    console.log(`✅ Article KB ${id} mis à jour:`, result.rows[0]);
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('❌ Erreur mise à jour article KB:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

app.delete('/api/admin/support/kb/articles/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🔍 DELETE /api/admin/support/kb/articles/${id} - Suppression d'un article KB...`);
    console.log('👤 User ID:', req.user.id);
    
    // Vérifier si l'utilisateur est admin
    const userCheck = await pool.query(
      'SELECT is_admin FROM profiles WHERE id = $1',
      [req.user.id]
    );
    
    if (userCheck.rows.length === 0 || !userCheck.rows[0].is_admin) {
      console.log('❌ Utilisateur non autorisé (pas admin)');
      return res.status(403).json({ success: false, error: 'Accès non autorisé' });
    }
    
    const result = await pool.query(
      `DELETE FROM support_kb_articles WHERE id = $1 RETURNING *`,
      [id]
    );
    
    if (result.rows.length === 0) {
      console.log(`❌ Article KB ${id} non trouvé`);
      return res.status(404).json({ success: false, error: 'Article KB non trouvé' });
    }
    
    console.log(`✅ Article KB ${id} supprimé:`, result.rows[0]);
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('❌ Erreur suppression article KB:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});



// Récupérer une réservation spécifique
app.get('/api/bookings/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🔍 GET /api/bookings/${id} - Récupération de la réservation...`);
    
    const result = await pool.query(
      `SELECT b.*, s.name as space_name, s.description as space_description, 
              s.capacity as space_capacity, s.price_per_hour, s.price_per_day, s.price_per_half_day,
              p.full_name as user_name, p.email as user_email
       FROM bookings b
       JOIN spaces s ON b.space_id = s.id
       JOIN profiles p ON b.user_id = p.id
       WHERE b.id = $1 AND b.user_id = $2`,
      [id, req.user.id]
    );
    
    if (result.rows.length === 0) {
      console.log(`❌ Réservation ${id} non trouvée ou non autorisée`);
      return res.status(404).json({ success: false, error: 'Réservation non trouvée' });
    }
    
    console.log(`✅ Réservation ${id} trouvée`);
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('❌ Erreur récupération réservation:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

app.post('/api/bookings', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 POST /api/bookings - Données reçues:', req.body);
    
    const { 
      user_id, 
      space_id, 
      start_time, 
      end_time, 
      status, 
      total_price_ht, 
      total_price_ttc, 
      description, 
      attendees 
    } = req.body;

    // Convertir start_time et end_time en dates complètes
    const startDate = new Date(start_time);
    const endDate = new Date(end_time);

    const result = await pool.query(
      `INSERT INTO bookings (user_id, space_id, start_date, end_date, total_price, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [user_id, space_id, startDate, endDate, total_price_ht, status || 'pending']
    );

    console.log('✅ Réservation créée:', result.rows[0]);
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('❌ Erreur création réservation:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

// Routes pour les paramètres admin
app.get('/api/admin/settings', authenticateToken, async (req, res) => {
  try {
    // Vérifier si l'utilisateur est admin
    if (!req.user.is_admin) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    const result = await pool.query('SELECT * FROM admin_settings ORDER BY key');
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Erreur récupération paramètres:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Route pour sauvegarder les paramètres admin
app.post('/api/admin/settings', authenticateToken, async (req, res) => {
  try {
    // Vérifier si l'utilisateur est admin
    if (!req.user.is_admin) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    const { key, value } = req.body;

    if (!key || !value) {
      return res.status(400).json({ error: 'Clé et valeur requises' });
    }

    // Vérifier si l'enregistrement existe
    const existingResult = await pool.query(
      'SELECT id FROM admin_settings WHERE key = $1',
      [key]
    );

    if (existingResult.rows.length > 0) {
      // Mise à jour
      await pool.query(
        'UPDATE admin_settings SET value = $1, updated_at = NOW() WHERE key = $2',
        [value, key]
      );
    } else {
      // Insertion
      await pool.query(
        'INSERT INTO admin_settings (key, value) VALUES ($1, $2)',
        [key, value]
      );
    }

    res.json({ success: true, message: 'Paramètres sauvegardés avec succès' });
  } catch (error) {
    console.error('Erreur sauvegarde paramètres:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Route pour récupérer les utilisateurs (admin seulement)
app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    // Vérifier que l'utilisateur est admin
    const userResult = await pool.query(
      'SELECT is_admin FROM profiles WHERE id = $1',
      [req.user.id]
    );

    if (userResult.rows.length === 0 || !userResult.rows[0].is_admin) {
      return res.status(403).json({ error: 'Accès refusé - droits administrateur requis' });
    }

    // Récupérer tous les utilisateurs
    const result = await pool.query(`
      SELECT 
        id,
        email,
        first_name,
        last_name,
        full_name,
        phone,
        company,
        created_at,
        updated_at,
        is_admin
      FROM profiles 
      ORDER BY created_at DESC
    `);

    res.json({ 
      success: true, 
      data: result.rows 
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération des utilisateurs' 
    });
  }
});

// Route pour récupérer les paiements (admin seulement)
app.get('/api/payments', authenticateToken, async (req, res) => {
  try {
    // Vérifier que l'utilisateur est admin
    const userResult = await pool.query(
      'SELECT is_admin FROM profiles WHERE id = $1',
      [req.user.id]
    );

    if (userResult.rows.length === 0 || !userResult.rows[0].is_admin) {
      return res.status(403).json({ error: 'Accès refusé - droits administrateur requis' });
    }

    // Récupérer tous les paiements avec détails des réservations
    const result = await pool.query(`
      SELECT 
        p.*,
        b.start_date,
        b.end_date,
        b.total_price as booking_total,
        b.status as booking_status,
        s.name as space_name,
        pr.full_name as user_name,
        pr.email as user_email
      FROM payments p
      LEFT JOIN bookings b ON p.booking_id = b.id
      LEFT JOIN spaces s ON b.space_id = s.id
      LEFT JOIN profiles pr ON b.user_id = pr.id
      ORDER BY p.created_at DESC
    `);

    res.json({ 
      success: true, 
      data: result.rows 
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des paiements:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération des paiements' 
    });
  }
});

// Routes pour les créneaux horaires (admin seulement)
app.get('/api/time-slots', authenticateToken, async (req, res) => {
  try {
    // Vérifier que l'utilisateur est admin
    const userResult = await pool.query(
      'SELECT is_admin FROM profiles WHERE id = $1',
      [req.user.id]
    );

    if (userResult.rows.length === 0 || !userResult.rows[0].is_admin) {
      return res.status(403).json({ error: 'Accès refusé - droits administrateur requis' });
    }

    const result = await pool.query(
      'SELECT * FROM time_slots ORDER BY display_order ASC, start_time ASC'
    );

    res.json({ 
      success: true, 
      data: result.rows 
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des créneaux horaires:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération des créneaux horaires' 
    });
  }
});

app.post('/api/time-slots', authenticateToken, async (req, res) => {
  try {
    // Vérifier que l'utilisateur est admin
    const userResult = await pool.query(
      'SELECT is_admin FROM profiles WHERE id = $1',
      [req.user.id]
    );

    if (userResult.rows.length === 0 || !userResult.rows[0].is_admin) {
      return res.status(403).json({ error: 'Accès refusé - droits administrateur requis' });
    }

    const { day_of_week, start_time, end_time, space_id, is_active } = req.body;

    const result = await pool.query(
      `INSERT INTO time_slots (day_of_week, start_time, end_time, space_id, is_active, display_order)
       VALUES ($1, $2, $3, $4, $5, COALESCE((SELECT MAX(display_order) FROM time_slots), 0) + 1) RETURNING *`,
      [day_of_week || 1, start_time, end_time, space_id || null, is_active !== false]
    );

    res.status(201).json({ 
      success: true, 
      data: result.rows[0] 
    });
  } catch (error) {
    console.error('Erreur lors de la création du créneau horaire:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la création du créneau horaire' 
    });
  }
});

app.put('/api/time-slots/:id', authenticateToken, async (req, res) => {
  try {
    // Vérifier que l'utilisateur est admin
    const userResult = await pool.query(
      'SELECT is_admin FROM profiles WHERE id = $1',
      [req.user.id]
    );

    if (userResult.rows.length === 0 || !userResult.rows[0].is_admin) {
      return res.status(403).json({ error: 'Accès refusé - droits administrateur requis' });
    }

    const { id } = req.params;
    const { day_of_week, start_time, end_time, space_id, is_active, display_order } = req.body;

    const result = await pool.query(
      `UPDATE time_slots 
       SET day_of_week = $1, start_time = $2, end_time = $3, space_id = $4, is_active = $5, display_order = $6, updated_at = NOW()
       WHERE id = $7 RETURNING *`,
      [day_of_week, start_time, end_time, space_id, is_active, display_order, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Créneau horaire non trouvé' 
      });
    }

    res.json({ 
      success: true, 
      data: result.rows[0] 
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du créneau horaire:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la mise à jour du créneau horaire' 
    });
  }
});

app.delete('/api/time-slots/:id', authenticateToken, async (req, res) => {
  try {
    // Vérifier que l'utilisateur est admin
    const userResult = await pool.query(
      'SELECT is_admin FROM profiles WHERE id = $1',
      [req.user.id]
    );

    if (userResult.rows.length === 0 || !userResult.rows[0].is_admin) {
      return res.status(403).json({ error: 'Accès refusé - droits administrateur requis' });
    }

    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM time_slots WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Créneau horaire non trouvé' 
      });
    }

    res.json({ 
      success: true, 
      message: 'Créneau horaire supprimé avec succès' 
    });
  } catch (error) {
    console.error('Erreur lors de la suppression du créneau horaire:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la suppression du créneau horaire' 
    });
  }
});

// Route pour récupérer les modèles d'email (admin seulement)
app.get('/api/email-templates', authenticateToken, async (req, res) => {
  try {
    // Vérifier que l'utilisateur est admin
    const userResult = await pool.query(
      'SELECT is_admin FROM profiles WHERE id = $1',
      [req.user.id]
    );

    if (userResult.rows.length === 0 || !userResult.rows[0].is_admin) {
      return res.status(403).json({ error: 'Accès refusé - droits administrateur requis' });
    }

    const result = await pool.query(
      'SELECT * FROM email_templates ORDER BY created_at DESC'
    );

    res.json({ 
      success: true, 
      data: result.rows 
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des modèles d\'email:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération des modèles d\'email' 
    });
  }
});

// Route pour récupérer les pages légales
app.get('/api/legal-pages', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM legal_pages ORDER BY type'
    );

    res.json({ 
      success: true, 
      data: result.rows 
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des pages légales:', error);
    
    // Si la table n'existe pas, retourner des données par défaut
    if (error.code === '42P01') {
      console.log('📝 Table legal_pages inexistante, retour des données par défaut');
      const defaultPages = [
        {
          id: 'default-terms',
          type: 'terms',
          title: 'Conditions Générales d\'Utilisation',
          content: 'Contenu des conditions générales...',
          last_updated: new Date().toISOString()
        },
        {
          id: 'default-privacy',
          type: 'privacy',
          title: 'Politique de Confidentialité',
          content: 'Contenu de la politique de confidentialité...',
          last_updated: new Date().toISOString()
        },
        {
          id: 'default-legal',
          type: 'legal',
          title: 'Mentions Légales',
          content: 'Contenu des mentions légales...',
          last_updated: new Date().toISOString()
        }
      ];
      
      res.json({ 
        success: true, 
        data: defaultPages 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        error: 'Erreur lors de la récupération des pages légales' 
      });
    }
  }
});

// Route pour récupérer les paramètres de cookies
app.get('/api/cookie-settings', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM cookie_settings LIMIT 1'
    );

    if (result.rows.length > 0) {
      res.json({ 
        success: true, 
        data: result.rows[0] 
      });
    } else {
      // Retourner des paramètres par défaut si aucun paramètre n'existe
      const defaultSettings = {
        id: 'default',
        title: 'Paramètres de Cookies',
        description: 'Gérez vos préférences de cookies',
        accept_button_text: 'Accepter',
        reject_button_text: 'Refuser',
        cookie_policy_url: '/privacy',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      res.json({ 
        success: true, 
        data: defaultSettings 
      });
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des paramètres de cookies:', error);
    
    // Si la table n'existe pas, retourner des paramètres par défaut
    if (error.code === '42P01') {
      console.log('📝 Table cookie_settings inexistante, retour des paramètres par défaut');
      const defaultSettings = {
        id: 'default',
        title: 'Paramètres de Cookies',
        description: 'Gérez vos préférences de cookies',
        accept_button_text: 'Accepter',
        reject_button_text: 'Refuser',
        cookie_policy_url: '/privacy',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      res.json({ 
        success: true, 
        data: defaultSettings 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        error: 'Erreur lors de la récupération des paramètres de cookies' 
      });
    }
  }
});

// Route pour mettre à jour les paramètres de cookies
app.put('/api/cookie-settings', authenticateToken, async (req, res) => {
  try {
    const settings = req.body;
    console.log('🔍 PUT /api/cookie-settings - Mise à jour des paramètres cookies...');
    console.log('👤 User ID:', req.user.id);
    console.log('📊 Données:', settings);
    
    // Vérifier si l'utilisateur est admin
    const userCheck = await pool.query(
      'SELECT is_admin FROM profiles WHERE id = $1',
      [req.user.id]
    );
    
    if (userCheck.rows.length === 0 || !userCheck.rows[0].is_admin) {
      console.log('❌ Utilisateur non autorisé (pas admin)');
      return res.status(403).json({ success: false, error: 'Accès non autorisé' });
    }
    
    // Vérifier si la table existe, sinon la créer
    try {
      await pool.query('SELECT 1 FROM cookie_settings LIMIT 1');
    } catch (tableError) {
      if (tableError.code === '42P01') {
        console.log('📝 Création de la table cookie_settings...');
        await pool.query(`
          CREATE TABLE IF NOT EXISTS cookie_settings (
            id VARCHAR(50) PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            accept_button_text VARCHAR(100),
            reject_button_text VARCHAR(100),
            settings_button_text VARCHAR(100),
            save_preferences_text VARCHAR(100),
            necessary_cookies_title VARCHAR(255),
            necessary_cookies_description TEXT,
            analytics_cookies_title VARCHAR(255),
            analytics_cookies_description TEXT,
            analytics_cookies_enabled BOOLEAN DEFAULT false,
            marketing_cookies_title VARCHAR(255),
            marketing_cookies_description TEXT,
            marketing_cookies_enabled BOOLEAN DEFAULT false,
            privacy_policy_url VARCHAR(500),
            cookie_policy_url VARCHAR(500),
            is_active BOOLEAN DEFAULT true,
            banner_position VARCHAR(50) DEFAULT 'bottom',
            banner_layout VARCHAR(50) DEFAULT 'horizontal',
            primary_color VARCHAR(7) DEFAULT '#007bff',
            secondary_color VARCHAR(7) DEFAULT '#6c757d',
            background_color VARCHAR(7) DEFAULT '#ffffff',
            text_color VARCHAR(7) DEFAULT '#000000',
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          )
        `);
        
        // Insérer un enregistrement par défaut
        await pool.query(`
          INSERT INTO cookie_settings (
            id, title, description, accept_button_text, reject_button_text,
            settings_button_text, save_preferences_text, necessary_cookies_title,
            necessary_cookies_description, analytics_cookies_title, analytics_cookies_description,
            analytics_cookies_enabled, marketing_cookies_title, marketing_cookies_description,
            marketing_cookies_enabled, privacy_policy_url, cookie_policy_url, is_active,
            banner_position, banner_layout, primary_color, secondary_color, background_color, text_color
          ) VALUES (
            'default', 'Paramètres de Cookies', 'Gérez vos préférences de cookies',
            'Accepter', 'Refuser', 'Paramètres', 'Sauvegarder', 'Cookies nécessaires',
            'Ces cookies sont essentiels au fonctionnement du site', 'Cookies analytiques',
            'Ces cookies nous aident à comprendre comment vous utilisez notre site',
            false, 'Cookies marketing', 'Ces cookies sont utilisés pour vous proposer des publicités personnalisées',
            false, '/privacy', '/privacy', true, 'bottom', 'horizontal',
            '#007bff', '#6c757d', '#ffffff', '#000000'
          )
        `);
        console.log('✅ Table cookie_settings créée avec données par défaut');
      } else {
        throw tableError;
      }
    }
    
    const result = await pool.query(
      `UPDATE cookie_settings SET 
       title = $1, description = $2, accept_button_text = $3, reject_button_text = $4,
       settings_button_text = $5, save_preferences_text = $6, necessary_cookies_title = $7,
       necessary_cookies_description = $8, analytics_cookies_title = $9, analytics_cookies_description = $10,
       analytics_cookies_enabled = $11, marketing_cookies_title = $12, marketing_cookies_description = $13,
       marketing_cookies_enabled = $14, privacy_policy_url = $15, cookie_policy_url = $16,
       is_active = $17, banner_position = $18, banner_layout = $19, primary_color = $20,
       secondary_color = $21, background_color = $22, text_color = $23, updated_at = NOW()
       WHERE id = $24
       RETURNING *`,
      [
        settings.title, settings.description, settings.accept_button_text, settings.reject_button_text,
        settings.settings_button_text, settings.save_preferences_text, settings.necessary_cookies_title,
        settings.necessary_cookies_description, settings.analytics_cookies_title, settings.analytics_cookies_description,
        settings.analytics_cookies_enabled, settings.marketing_cookies_title, settings.marketing_cookies_description,
        settings.marketing_cookies_enabled, settings.privacy_policy_url, settings.cookie_policy_url,
        settings.is_active, settings.banner_position, settings.banner_layout, settings.primary_color,
        settings.secondary_color, settings.background_color, settings.text_color, settings.id
      ]
    );
    
    if (result.rows.length === 0) {
      console.log('❌ Paramètres cookies non trouvés');
      return res.status(404).json({ success: false, error: 'Paramètres non trouvés' });
    }
    
    console.log(`✅ Paramètres cookies mis à jour:`, result.rows[0]);
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('❌ Erreur mise à jour paramètres cookies:', error);
    console.error('❌ Détails erreur:', error.message);
    console.error('❌ Stack trace:', error.stack);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});


// Endpoints admin pour les tickets de support
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
    
    console.log('✅ Réponse ajoutée:', result.rows[0]);
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('❌ Erreur ajout réponse:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

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
    
    console.log('✅ Statut mis à jour:', result.rows[0]);
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('❌ Erreur mise à jour statut:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

// Endpoint temporaire pour créer un ticket utilisateur sans authentification
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

// Endpoint temporaire pour récupérer les tickets sans authentification
app.get('/api/admin/support/tickets-no-auth', async (req, res) => {
  try {
    console.log('🔍 Récupération des tickets admin (sans auth)...');
    
    const result = await pool.query(
      `SELECT st.*, p.full_name as user_name, p.email as user_email
       FROM support_tickets st
       JOIN profiles p ON st.user_id = p.id
       ORDER BY st.created_at DESC`
    );
    
    console.log(`✅ ${result.rows.length} tickets trouvés`);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('❌ Erreur récupération tickets admin:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

// Endpoint temporaire pour récupérer les réponses utilisateur sans authentification
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

// Endpoint temporaire pour récupérer les réponses sans authentification
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

// Endpoint temporaire pour ajouter une réponse utilisateur sans authentification
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

// Endpoints temporaires pour le chat utilisateur sans authentification
app.get('/api/support/chat/sessions-user-no-auth', async (req, res) => {
  try {
    console.log('🔍 Récupération des sessions chat utilisateur (sans auth)...');
    
    // Mettre à jour les sessions existantes avec status 'active' vers 'open'
    try {
      await pool.query(
        `UPDATE support_chat_sessions 
         SET status = 'open' 
         WHERE user_id = 'f6682b18-7d10-4016-be08-885e989cffca' 
         AND status = 'active'`
      );
      console.log('✅ Sessions mises à jour vers status open');
    } catch (updateError) {
      console.log('⚠️ Erreur mise à jour sessions (non critique):', updateError.message);
    }
    
    const result = await pool.query(
      `SELECT * FROM support_chat_sessions 
       WHERE user_id = 'f6682b18-7d10-4016-be08-885e989cffca'
       ORDER BY created_at DESC`
    );
    
    console.log(`✅ ${result.rows.length} sessions chat trouvées`);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('❌ Erreur récupération sessions chat:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

app.get('/api/support/chat/sessions/:id/messages-user-no-auth', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🔍 Récupération des messages chat utilisateur (sans auth): ${id}`);
    
    const result = await pool.query(
      `SELECT *,
              CASE 
                WHEN message_type = 'admin' THEN true
                WHEN message_type = 'user' THEN false
                ELSE false
              END as is_admin
       FROM support_chat_messages 
       WHERE session_id = $1 
       ORDER BY created_at ASC`,
      [id]
    );
    
    console.log(`✅ ${result.rows.length} messages trouvés`);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('❌ Erreur récupération messages chat:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

app.post('/api/support/chat/sessions-user-no-auth', async (req, res) => {
  try {
    console.log('🔍 Création session chat utilisateur (sans auth)...');
    
    // Solution de contournement : retourner une session existante ou créer une session simple
    const sessionId = 'session-' + Date.now();
    const userId = 'f6682b18-7d10-4016-be08-885e989cffca';
    
    // Retourner directement une session sans insertion en base
    const sessionData = {
      id: sessionId,
      user_id: userId,
      status: 'open',
      created_at: new Date().toISOString()
    };
    
    console.log(`✅ Session chat créée (contournement):`, sessionData);
    res.json({ success: true, data: sessionData });
  } catch (error) {
    console.error('❌ Erreur création session chat:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/support/chat/messages-user-no-auth', async (req, res) => {
  try {
    const { session_id, message } = req.body;
    console.log('🔍 Envoi message chat utilisateur (sans auth)...');
    
    // Vérifier si la table existe, sinon la créer
    try {
      await pool.query('SELECT 1 FROM support_chat_messages LIMIT 1');
      console.log('✅ Table support_chat_messages existe');
    } catch (tableError) {
      if (tableError.code === '42P01') {
        console.log('📝 Création de la table support_chat_messages...');
        await pool.query(`
          CREATE TABLE IF NOT EXISTS support_chat_messages (
            id VARCHAR(36) PRIMARY KEY,
            session_id VARCHAR(36) NOT NULL,
            user_id VARCHAR(36) NOT NULL,
            message TEXT NOT NULL,
            message_type VARCHAR(20) DEFAULT 'user',
            created_at TIMESTAMP DEFAULT NOW()
          )
        `);
        console.log('✅ Table support_chat_messages créée');
      } else {
        throw tableError;
      }
    }
    
    const messageId = crypto.randomUUID();
    const userId = 'f6682b18-7d10-4016-be08-885e989cffca';
    
    const result = await pool.query(
      `INSERT INTO support_chat_messages (id, session_id, user_id, message, message_type, created_at)
       VALUES ($1, $2, $3, $4, 'user', NOW())
       RETURNING *`,
      [messageId, session_id, userId, message]
    );
    
    console.log(`✅ Message chat envoyé:`, result.rows[0]);
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('❌ Erreur envoi message chat:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

// Endpoint temporaire pour récupérer les utilisateurs de chat admin sans authentification
app.get('/api/admin/support/chat/users-no-auth', async (req, res) => {
  try {
    console.log('🔍 Récupération des utilisateurs chat admin (sans auth)...');
    
    const result = await pool.query(
      `SELECT DISTINCT p.id as user_id, p.full_name, p.email, p.avatar_url,
              MAX(scm.created_at) as last_message_at
       FROM profiles p
       JOIN support_chat_sessions scs ON p.id = scs.user_id
       JOIN support_chat_messages scm ON scs.id = scm.session_id
       GROUP BY p.id, p.full_name, p.email, p.avatar_url
       ORDER BY last_message_at DESC`
    );
    
    console.log(`✅ ${result.rows.length} utilisateurs chat trouvés`);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('❌ Erreur récupération utilisateurs chat:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

// Endpoints temporaires pour le chat admin sans authentification
app.get('/api/admin/support/chat/sessions/:userId/sessions-no-auth', async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(`🔍 Récupération des sessions chat admin (sans auth): ${userId}`);
    
    const result = await pool.query(
      `SELECT * FROM support_chat_sessions 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [userId]
    );
    
    console.log(`✅ ${result.rows.length} sessions trouvées`);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('❌ Erreur récupération sessions chat admin:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

app.get('/api/admin/support/chat/sessions/:sessionId/messages-no-auth', async (req, res) => {
  try {
    const { sessionId } = req.params;
    console.log(`🔍 Récupération des messages chat admin (sans auth): ${sessionId}`);
    
    const result = await pool.query(
      `SELECT scm.*, p.full_name, p.email,
              CASE 
                WHEN scm.message_type = 'admin' THEN true
                WHEN scm.message_type = 'user' THEN false
                ELSE false
              END as is_admin
       FROM support_chat_messages scm
       JOIN profiles p ON scm.user_id = p.id
       WHERE scm.session_id = $1 
       ORDER BY scm.created_at ASC`,
      [sessionId]
    );
    
    console.log(`✅ ${result.rows.length} messages trouvés`);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('❌ Erreur récupération messages chat admin:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

app.post('/api/admin/support/chat/messages-no-auth', async (req, res) => {
  try {
    const { session_id, message } = req.body;
    console.log('🔍 Envoi message chat admin (sans auth)...');
    
    const messageId = crypto.randomUUID();
    const adminUserId = 'f6682b18-7d10-4016-be08-885e989cffca'; // ID admin fixe pour le test
    
    const result = await pool.query(
      `INSERT INTO support_chat_messages (id, session_id, user_id, message, message_type, created_at)
       VALUES ($1, $2, $3, $4, 'admin', NOW())
       RETURNING *`,
      [messageId, session_id, adminUserId, message]
    );
    
    console.log(`✅ Message chat admin envoyé:`, result.rows[0]);
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('❌ Erreur envoi message chat admin:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

// Endpoint temporaire pour ajouter une réponse admin sans authentification
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
    } catch (tableError) {
      if (tableError.code === '42P01') {
        console.log('📝 Création de la table support_ticket_responses...');
        await pool.query(`
          CREATE TABLE IF NOT EXISTS support_ticket_responses (
            id VARCHAR(36) PRIMARY KEY,
            ticket_id VARCHAR(36) NOT NULL,
            user_id VARCHAR(36) NOT NULL,
            message TEXT NOT NULL,
            is_admin BOOLEAN DEFAULT false,
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

// Endpoint temporaire pour créer un ticket sans authentification (pour contourner le problème de token)
app.post('/api/support/tickets-no-auth', async (req, res) => {
  try {
    console.log('🔍 Création ticket support sans auth...');
    console.log('📝 Données reçues:', req.body);
    
    const { subject, message, priority = 'medium' } = req.body;
    const userId = 'f6682b18-7d10-4016-be08-885e989cffca'; // ID fixe pour le test
    
    console.log('📝 Données extraites:', { subject, message, priority, userId });
    
    // Vérifier si la table existe
    try {
      await pool.query('SELECT 1 FROM support_tickets LIMIT 1');
      console.log('✅ Table support_tickets existe');
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
    console.log('📝 UUID généré:', ticketId);
    
    const result = await pool.query(
      `INSERT INTO support_tickets (id, user_id, subject, message, priority, status, created_at)
       VALUES ($1, $2, $3, $4, $5, 'open', NOW())
       RETURNING *`,
      [ticketId, userId, subject, message, priority]
    );
    
    console.log('✅ Ticket créé:', result.rows[0]);
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('❌ Erreur création ticket:', error);
    console.error('❌ Détails erreur:', error.message);
    console.error('❌ Stack trace:', error.stack);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint de test temporaire pour créer un ticket sans authentification
app.post('/api/test-support-ticket', async (req, res) => {
  try {
    console.log('🔍 Test création ticket support...');
    console.log('📝 Données reçues:', req.body);
    
    const { subject, message, priority = 'medium' } = req.body;
    const userId = 'f6682b18-7d10-4016-be08-885e989cffca'; // ID fixe pour le test
    
    console.log('📝 Données extraites:', { subject, message, priority, userId });
    
    // Vérifier si la table existe
    try {
      await pool.query('SELECT 1 FROM support_tickets LIMIT 1');
      console.log('✅ Table support_tickets existe');
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
    console.log('📝 UUID généré:', ticketId);
    
    const result = await pool.query(
      `INSERT INTO support_tickets (id, user_id, subject, message, priority, status, created_at)
       VALUES ($1, $2, $3, $4, $5, 'open', NOW())
       RETURNING *`,
      [ticketId, userId, subject, message, priority]
    );
    
    console.log('✅ Ticket créé:', result.rows[0]);
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('❌ Erreur test ticket:', error);
    console.error('❌ Détails erreur:', error.message);
    console.error('❌ Stack trace:', error.stack);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Routes pour les images du carrousel
app.get('/api/carousel-images', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM carousel_images ORDER BY display_order ASC'
    );

    res.json({ 
      success: true, 
      data: result.rows 
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des images du carrousel:', error);
    
    // Si la table n'existe pas, retourner une liste vide
    if (error.code === '42P01') {
      console.log('📝 Table carousel_images inexistante, retour d\'une liste vide');
      res.json({ 
        success: true, 
        data: [] 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        error: 'Erreur lors de la récupération des images du carrousel' 
      });
    }
  }
});

app.post('/api/carousel-images', async (req, res) => {
  try {
    // Pour l'instant, permettre l'ajout sans authentification
    // TODO: Ajouter l'authentification admin si nécessaire

    const { image_url, display_order } = req.body;

    const result = await pool.query(
      'INSERT INTO carousel_images (image_url, display_order) VALUES ($1, $2) RETURNING *',
      [image_url, display_order || 0]
    );

    res.status(201).json({ 
      success: true, 
      data: result.rows[0] 
    });
  } catch (error) {
    console.error('Erreur lors de l\'ajout de l\'image du carrousel:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de l\'ajout de l\'image du carrousel' 
    });
  }
});

app.delete('/api/carousel-images/:id', authenticateToken, async (req, res) => {
  try {
    // Vérifier que l'utilisateur est admin
    const userResult = await pool.query(
      'SELECT is_admin FROM profiles WHERE id = $1',
      [req.user.id]
    );

    if (userResult.rows.length === 0 || !userResult.rows[0].is_admin) {
      return res.status(403).json({ error: 'Accès refusé - droits administrateur requis' });
    }

    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM carousel_images WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Image du carrousel non trouvée' 
      });
    }

    res.json({ 
      success: true, 
      message: 'Image du carrousel supprimée avec succès' 
    });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'image du carrousel:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la suppression de l\'image du carrousel' 
    });
  }
});

// Routes pour les paramètres de la page d'accueil
app.get('/api/homepage-settings', async (req, res) => {
  try {
    console.log('🔍 GET /api/homepage-settings - Récupération des paramètres homepage');
    
    const result = await pool.query(
      'SELECT * FROM admin_settings WHERE key = $1',
      ['homepage']
    );

    if (result.rows.length === 0) {
      // Retourner des paramètres par défaut si aucun n'existe
      const defaultSettings = {
        title: "CoworkMy",
        description: "Plateforme de coworking moderne",
        hero_title: "Bienvenue sur CoworkMy",
        hero_subtitle: "Découvrez nos espaces de coworking",
        hero_background_image: "https://images.unsplash.com/photo-1600508774636-7b9d1a4db91f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80",
        cta_text: "Commencer",
        features_title: "Fonctionnalités",
        features_subtitle: "Découvrez nos services",
        cta_section_title: "Prêt à commencer ?",
        cta_section_subtitle: "Rejoignez-nous dès aujourd'hui",
        cta_secondary_button_text: "En savoir plus",
        is_published: true
      };
      
      console.log('📄 Paramètres par défaut retournés');
      return res.json({ success: true, data: defaultSettings });
    }

    const settings = result.rows[0].value;
    console.log('✅ Paramètres homepage récupérés:', settings);
    res.json({ success: true, data: settings });
  } catch (error) {
    console.error('❌ Erreur récupération paramètres homepage:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

app.post('/api/homepage-settings', authenticateToken, async (req, res) => {
  try {
    const { title, description, hero_title, hero_subtitle, hero_background_image, cta_text, features_title, features_subtitle, cta_section_title, cta_section_subtitle, cta_secondary_button_text, is_published } = req.body;
    
    console.log('💾 POST /api/homepage-settings - Sauvegarde des paramètres homepage');
    
    const settingsData = {
      title,
      description,
      hero_title,
      hero_subtitle,
      hero_background_image,
      cta_text,
      features_title,
      features_subtitle,
      cta_section_title,
      cta_section_subtitle,
      cta_secondary_button_text,
      is_published
    };

    // Vérifier si les paramètres existent déjà
    const existingResult = await pool.query(
      'SELECT id FROM admin_settings WHERE key = $1',
      ['homepage']
    );

    if (existingResult.rows.length > 0) {
      // Mettre à jour les paramètres existants
      await pool.query(
        'UPDATE admin_settings SET value = $1, updated_at = NOW() WHERE key = $2',
        [settingsData, 'homepage']
      );
      console.log('✅ Paramètres homepage mis à jour');
    } else {
      // Créer de nouveaux paramètres
      await pool.query(
        'INSERT INTO admin_settings (key, value) VALUES ($1, $2)',
        ['homepage', settingsData]
      );
      console.log('✅ Nouveaux paramètres homepage créés');
    }

    res.json({ success: true, data: settingsData });
  } catch (error) {
    console.error('❌ Erreur sauvegarde paramètres homepage:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

// Mettre à jour une réservation
app.put('/api/bookings/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🔍 PUT /api/bookings/${id} - Mise à jour de la réservation...`);
    console.log('📊 Données reçues:', req.body);
    
    const { 
      space_id, 
      start_date, 
      end_date, 
      total_price, 
      status 
    } = req.body;

    const result = await pool.query(
      `UPDATE bookings 
       SET space_id = $1, start_date = $2, end_date = $3, total_price = $4, status = $5, updated_at = NOW()
       WHERE id = $6 AND user_id = $7
       RETURNING *`,
      [space_id, start_date, end_date, total_price, status, id, req.user.id]
    );

    if (result.rows.length === 0) {
      console.log(`❌ Réservation ${id} non trouvée ou non autorisée`);
      return res.status(404).json({ success: false, error: 'Réservation non trouvée' });
    }

    console.log(`✅ Réservation ${id} mise à jour:`, result.rows[0]);
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('❌ Erreur mise à jour réservation:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

// Supprimer une réservation
app.delete('/api/bookings/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🗑️ DELETE /api/bookings/${id} - Suppression de la réservation...`);
    
    const result = await pool.query(
      'DELETE FROM bookings WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, req.user.id]
    );
    
    if (result.rows.length === 0) {
      console.log(`❌ Réservation ${id} non trouvée ou non autorisée`);
      return res.status(404).json({ success: false, error: 'Réservation non trouvée' });
    }
    
    console.log(`✅ Réservation ${id} supprimée`);
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('❌ Erreur suppression réservation:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

// Route de test
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'API CoworkMy fonctionne' });
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

// Endpoint pour créer les tables de chat
app.post('/api/create-chat-tables', async (req, res) => {
  try {
    console.log('🔍 Création des tables de chat...');
    
    // Créer la table support_chat_sessions
    await pool.query(`
      CREATE TABLE IF NOT EXISTS support_chat_sessions (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        status VARCHAR(20) DEFAULT 'open',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Table support_chat_sessions créée');
    
    // Créer la table support_chat_messages
    await pool.query(`
      CREATE TABLE IF NOT EXISTS support_chat_messages (
        id VARCHAR(36) PRIMARY KEY,
        session_id VARCHAR(36) NOT NULL,
        user_id VARCHAR(36) NOT NULL,
        message TEXT NOT NULL,
        message_type VARCHAR(20) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Table support_chat_messages créée');
    
    res.json({ status: 'OK', message: 'Tables créées avec succès' });
  } catch (error) {
    console.error('❌ Erreur création tables:', error);
    res.status(500).json({ status: 'ERROR', error: error.message });
  }
});

// Endpoint de test très simple
app.post('/api/simple-test', async (req, res) => {
  try {
    console.log('🔍 Test simple...');
    res.json({ success: true, message: 'Test simple OK' });
  } catch (error) {
    console.error('❌ Erreur test simple:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint de test crypto
app.post('/api/test-crypto', async (req, res) => {
  try {
    console.log('🔍 Test crypto...');
    const uuid = crypto.randomUUID();
    console.log('📝 UUID généré:', uuid);
    res.json({ success: true, uuid: uuid });
  } catch (error) {
    console.error('❌ Erreur test crypto:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint de test SQL
app.post('/api/test-sql', async (req, res) => {
  try {
    console.log('🔍 Test SQL...');
    const result = await pool.query('SELECT COUNT(*) as count FROM support_chat_sessions');
    console.log('📝 Nombre de sessions:', result.rows[0].count);
    res.json({ success: true, count: result.rows[0].count });
  } catch (error) {
    console.error('❌ Erreur test SQL:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint de test insertion SQL
app.post('/api/test-insert', async (req, res) => {
  try {
    console.log('🔍 Test insertion SQL...');
    const sessionId = crypto.randomUUID();
    const userId = 'f6682b18-7d10-4016-be08-885e989cffca';
    
    console.log('📝 Session ID:', sessionId);
    console.log('📝 User ID:', userId);
    
    const result = await pool.query(
      `INSERT INTO support_chat_sessions (id, user_id, status, created_at)
       VALUES ($1, $2, 'open', NOW())
       RETURNING *`,
      [sessionId, userId]
    );
    
    console.log('✅ Session insérée:', result.rows[0]);
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('❌ Erreur test insertion:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint de test insertion SQL simple
app.post('/api/test-insert-simple', async (req, res) => {
  try {
    console.log('🔍 Test insertion SQL simple...');
    const sessionId = 'test-' + Date.now();
    const userId = 'f6682b18-7d10-4016-be08-885e989cffca';
    
    console.log('📝 Session ID:', sessionId);
    console.log('📝 User ID:', userId);
    
    const result = await pool.query(
      `INSERT INTO support_chat_sessions (id, user_id, status, created_at)
       VALUES ($1, $2, 'open', NOW())
       RETURNING *`,
      [sessionId, userId]
    );
    
    console.log('✅ Session insérée:', result.rows[0]);
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('❌ Erreur test insertion simple:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint de test insertion SQL très simple
app.post('/api/test-insert-very-simple', async (req, res) => {
  try {
    console.log('🔍 Test insertion SQL très simple...');
    
    const result = await pool.query(
      `INSERT INTO support_chat_sessions (id, user_id, status, created_at)
       VALUES ('test-very-simple', 'f6682b18-7d10-4016-be08-885e989cffca', 'open', NOW())
       RETURNING *`
    );
    
    console.log('✅ Session insérée:', result.rows[0]);
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('❌ Erreur test insertion très simple:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint de test pour la création de session
app.post('/api/test-session', async (req, res) => {
  try {
    console.log('🔍 Test création session...');
    
    const sessionId = crypto.randomUUID();
    const userId = 'f6682b18-7d10-4016-be08-885e989cffca';
    
    console.log('📝 Session ID généré:', sessionId);
    console.log('📝 User ID:', userId);
    
    const result = await pool.query(
      `INSERT INTO support_chat_sessions (id, user_id, status, created_at)
       VALUES ($1, $2, 'open', NOW())
       RETURNING *`,
      [sessionId, userId]
    );
    
    console.log(`✅ Session test créée:`, result.rows[0]);
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('❌ Erreur test session:', error);
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
  console.log(`🚀 API CoworkMy démarrée sur le port ${PORT}`);
  console.log(`📊 Base de données: PostgreSQL sur 147.93.58.155:5432`);
  console.log(`🔗 URL: http://localhost:${PORT}`);
});

// Gestion propre de l'arrêt
process.on('SIGINT', async () => {
  console.log('\n🛑 Arrêt du serveur API...');
  await pool.end();
  process.exit(0);
});
