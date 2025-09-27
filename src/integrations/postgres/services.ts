// @ts-nocheck
import { query, transaction, getClient } from './client';
import * as Types from './types';

// Service pour les utilisateurs
export const UserService = {
  // Récupérer tous les utilisateurs
  async getAll(): Promise<Types.User[]> {
    const result = await query('SELECT * FROM users ORDER BY created_at DESC');
    return result.rows;
  },

  // Récupérer un utilisateur par son ID
  async getById(id: string): Promise<Types.User | null> {
    const result = await query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  // Récupérer un utilisateur par son email
  async getByEmail(email: string): Promise<Types.User | null> {
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0] || null;
  },

  // Créer un nouvel utilisateur
  async create(user: Omit<Types.User, 'id' | 'created_at' | 'updated_at'>): Promise<Types.User> {
    const result = await query(
      'INSERT INTO users (first_name, last_name, email, phone, is_admin) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [user.first_name, user.last_name, user.email, user.phone, user.is_admin]
    );
    return result.rows[0];
  },

  // Mettre à jour un utilisateur
  async update(id: string, user: Partial<Omit<Types.User, 'id' | 'created_at' | 'updated_at'>>): Promise<Types.User | null> {
    // Construire la requête dynamiquement en fonction des champs à mettre à jour
    const fields = Object.keys(user).filter(key => user[key] !== undefined);
    if (fields.length === 0) return this.getById(id);

    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
    const values = fields.map(field => user[field]);

    const result = await query(
      `UPDATE users SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id, ...values]
    );
    return result.rows[0] || null;
  },

  // Supprimer un utilisateur
  async delete(id: string): Promise<boolean> {
    const result = await query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
    return result.rowCount > 0;
  },

  // Vérifier si un utilisateur est administrateur
  async isAdmin(id: string): Promise<boolean> {
    const result = await query('SELECT is_admin FROM users WHERE id = $1', [id]);
    return result.rows[0]?.is_admin || false;
  }
};

// Service pour les espaces
export const SpaceService = {
  // Récupérer tous les espaces
  async getAll(): Promise<Types.Space[]> {
    const result = await query('SELECT * FROM spaces ORDER BY name');
    return result.rows;
  },

  // Récupérer un espace par son ID
  async getById(id: string): Promise<Types.Space | null> {
    const result = await query('SELECT * FROM spaces WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  // Récupérer les espaces actifs
  async getActive(): Promise<Types.Space[]> {
    const result = await query('SELECT * FROM spaces WHERE is_active = true ORDER BY name');
    return result.rows;
  },

  // Créer un nouvel espace
  async create(space: Omit<Types.Space, 'id' | 'created_at' | 'updated_at'>): Promise<Types.Space> {
    const result = await query(
      `INSERT INTO spaces (
        name, description, capacity, price_per_hour, price_per_day, price_per_month,
        price_per_half_day, price_per_quarter_day, pricing_type, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [
        space.name, space.description, space.capacity, space.price_per_hour,
        space.price_per_day, space.price_per_month, space.price_per_half_day,
        space.price_per_quarter_day, space.pricing_type, space.is_active
      ]
    );
    return result.rows[0];
  },

  // Mettre à jour un espace
  async update(id: string, space: Partial<Omit<Types.Space, 'id' | 'created_at' | 'updated_at'>>): Promise<Types.Space | null> {
    // Construire la requête dynamiquement en fonction des champs à mettre à jour
    const fields = Object.keys(space).filter(key => space[key] !== undefined);
    if (fields.length === 0) return this.getById(id);

    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
    const values = fields.map(field => space[field]);

    const result = await query(
      `UPDATE spaces SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id, ...values]
    );
    return result.rows[0] || null;
  },

  // Supprimer un espace
  async delete(id: string): Promise<boolean> {
    const result = await query('DELETE FROM spaces WHERE id = $1 RETURNING id', [id]);
    return result.rowCount > 0;
  }
};

// Service pour les réservations
export const BookingService = {
  // Récupérer toutes les réservations
  async getAll(): Promise<Types.Booking[]> {
    const result = await query('SELECT * FROM bookings ORDER BY created_at DESC');
    return result.rows;
  },

  // Récupérer une réservation par son ID
  async getById(id: string): Promise<Types.Booking | null> {
    const result = await query('SELECT * FROM bookings WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  // Récupérer les réservations d'un utilisateur
  async getByUserId(userId: string): Promise<Types.Booking[]> {
    const result = await query('SELECT * FROM bookings WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
    return result.rows;
  },

  // Récupérer les réservations pour un espace
  async getBySpaceId(spaceId: string): Promise<Types.Booking[]> {
    const result = await query('SELECT * FROM bookings WHERE space_id = $1 ORDER BY start_time', [spaceId]);
    return result.rows;
  },

  // Récupérer les réservations par statut
  async getByStatus(status: string): Promise<Types.Booking[]> {
    const result = await query('SELECT * FROM bookings WHERE status = $1 ORDER BY created_at DESC', [status]);
    return result.rows;
  },

  // Créer une nouvelle réservation
  async create(booking: Omit<Types.Booking, 'id' | 'created_at' | 'updated_at'>): Promise<Types.Booking> {
    const result = await query(
      `INSERT INTO bookings (
        user_id, space_id, start_time, end_time, status, total_price,
        total_price_ht, total_price_ttc, payment_intent_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [
        booking.user_id, booking.space_id, booking.start_time, booking.end_time,
        booking.status, booking.total_price, booking.total_price_ht,
        booking.total_price_ttc, booking.payment_intent_id
      ]
    );
    return result.rows[0];
  },

  // Mettre à jour une réservation
  async update(id: string, booking: Partial<Omit<Types.Booking, 'id' | 'created_at' | 'updated_at'>>): Promise<Types.Booking | null> {
    // Construire la requête dynamiquement en fonction des champs à mettre à jour
    const fields = Object.keys(booking).filter(key => booking[key] !== undefined);
    if (fields.length === 0) return this.getById(id);

    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
    const values = fields.map(field => booking[field]);

    const result = await query(
      `UPDATE bookings SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id, ...values]
    );
    return result.rows[0] || null;
  },

  // Supprimer une réservation
  async delete(id: string): Promise<boolean> {
    const result = await query('DELETE FROM bookings WHERE id = $1 RETURNING id', [id]);
    return result.rowCount > 0;
  },

  // Vérifier la disponibilité d'un espace pour une période donnée
  async checkAvailability(spaceId: string, startTime: Date, endTime: Date): Promise<boolean> {
    const result = await query(
      `SELECT COUNT(*) FROM bookings 
       WHERE space_id = $1 
       AND status != 'cancelled' 
       AND (
         (start_time <= $2 AND end_time > $2) OR
         (start_time < $3 AND end_time >= $3) OR
         (start_time >= $2 AND end_time <= $3)
       )`,
      [spaceId, startTime, endTime]
    );
    return parseInt(result.rows[0].count) === 0;
  }
};

// Service pour les paramètres d'administration
export const AdminSettingsService = {
  // Récupérer les paramètres d'administration
  async get(): Promise<Types.AdminSettings | null> {
    const result = await query('SELECT * FROM admin_settings LIMIT 1');
    return result.rows[0] || null;
  },

  // Mettre à jour les paramètres d'administration
  async update(settings: Partial<Omit<Types.AdminSettings, 'id' | 'created_at' | 'updated_at'>>): Promise<Types.AdminSettings | null> {
    // Récupérer d'abord les paramètres existants
    const current = await this.get();
    if (!current) return null;

    // Construire la requête dynamiquement en fonction des champs à mettre à jour
    const fields = Object.keys(settings).filter(key => settings[key] !== undefined);
    if (fields.length === 0) return current;

    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
    const values = fields.map(field => settings[field]);

    const result = await query(
      `UPDATE admin_settings SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [current.id, ...values]
    );
    return result.rows[0] || null;
  }
};

// Service pour les pages légales
export const LegalPageService = {
  // Récupérer toutes les pages légales
  async getAll(): Promise<Types.LegalPage[]> {
    const result = await query('SELECT * FROM legal_pages ORDER BY title');
    return result.rows;
  },

  // Récupérer une page légale par son slug
  async getBySlug(slug: string): Promise<Types.LegalPage | null> {
    const result = await query('SELECT * FROM legal_pages WHERE slug = $1', [slug]);
    return result.rows[0] || null;
  },

  // Récupérer une page légale par son ID
  async getById(id: string): Promise<Types.LegalPage | null> {
    const result = await query('SELECT * FROM legal_pages WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  // Créer une nouvelle page légale
  async create(page: Omit<Types.LegalPage, 'id' | 'created_at' | 'updated_at'>): Promise<Types.LegalPage> {
    const result = await query(
      'INSERT INTO legal_pages (slug, title, content, is_published) VALUES ($1, $2, $3, $4) RETURNING *',
      [page.slug, page.title, page.content, page.is_published]
    );
    return result.rows[0];
  },

  // Mettre à jour une page légale
  async update(id: string, page: Partial<Omit<Types.LegalPage, 'id' | 'created_at' | 'updated_at'>>): Promise<Types.LegalPage | null> {
    // Construire la requête dynamiquement en fonction des champs à mettre à jour
    const fields = Object.keys(page).filter(key => page[key] !== undefined);
    if (fields.length === 0) return this.getById(id);

    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
    const values = fields.map(field => page[field]);

    const result = await query(
      `UPDATE legal_pages SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id, ...values]
    );
    return result.rows[0] || null;
  },

  // Supprimer une page légale
  async delete(id: string): Promise<boolean> {
    const result = await query('DELETE FROM legal_pages WHERE id = $1 RETURNING id', [id]);
    return result.rowCount > 0;
  }
};

// Service pour les logs d'application
export const LogService = {
  // Ajouter un log
  async add(log: Omit<Types.ApplicationLog, 'id' | 'created_at'>): Promise<Types.ApplicationLog> {
    const result = await query(
      'INSERT INTO application_logs (level, message, context, timestamp) VALUES ($1, $2, $3, $4) RETURNING *',
      [log.level, log.message, log.context, log.timestamp]
    );
    return result.rows[0];
  },

  // Récupérer les logs
  async getAll(limit: number = 100, offset: number = 0): Promise<Types.ApplicationLog[]> {
    const result = await query(
      'SELECT * FROM application_logs ORDER BY timestamp DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );
    return result.rows;
  },

  // Récupérer les logs par niveau
  async getByLevel(level: string, limit: number = 100, offset: number = 0): Promise<Types.ApplicationLog[]> {
    const result = await query(
      'SELECT * FROM application_logs WHERE level = $1 ORDER BY timestamp DESC LIMIT $2 OFFSET $3',
      [level, limit, offset]
    );
    return result.rows;
  },

  // Supprimer les logs anciens
  async deleteOld(days: number = 30): Promise<number> {
    const result = await query(
      'DELETE FROM application_logs WHERE timestamp < NOW() - INTERVAL \'$1 days\' RETURNING id',
      [days]
    );
    return result.rowCount;
  }
};

// Exporter tous les services
export default {
  UserService,
  SpaceService,
  BookingService,
  AdminSettingsService,
  LegalPageService,
  LogService
};
