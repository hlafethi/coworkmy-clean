// Types pour la base de données PostgreSQL

// Utilisateurs
export interface User {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  phone: string | null;
  is_admin: boolean;
  created_at: Date;
  updated_at: Date;
}

// Espaces
export interface Space {
  id: string;
  name: string;
  description: string | null;
  capacity: number | null;
  price_per_hour: number | null;
  price_per_day: number | null;
  price_per_month: number | null;
  price_per_half_day: number | null;
  price_per_quarter_day: number | null;
  pricing_type: 'hourly' | 'daily' | 'monthly' | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

// Réservations
export interface Booking {
  id: string;
  user_id: string;
  space_id: string;
  start_time: Date;
  end_time: Date;
  status: 'pending' | 'confirmed' | 'cancelled';
  total_price: number | null;
  total_price_ht: number | null;
  total_price_ttc: number | null;
  payment_intent_id: string | null;
  created_at: Date;
  updated_at: Date;
}

// Créneaux horaires
export interface TimeSlot {
  id: string;
  space_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
  created_at: Date;
  updated_at: Date;
}

// Paramètres d'administration
export interface AdminSettings {
  id: string;
  site_name: string;
  contact_email: string | null;
  phone_number: string | null;
  hero_title: string | null;
  hero_subtitle: string | null;
  cta_text: string | null;
  features_title: string | null;
  features_subtitle: string | null;
  stripe_test_publishable_key: string | null;
  stripe_test_secret_key: string | null;
  stripe_webhook_secret: string | null;
  stripe_live_publishable_key: string | null;
  stripe_live_secret_key: string | null;
  stripe_live_webhook_secret: string | null;
  stripe_mode: 'test' | 'live' | null;
  workspace_title: string | null;
  created_at: Date;
  updated_at: Date;
}

// Pages légales
export interface LegalPage {
  id: string;
  slug: string;
  title: string;
  content: string | null;
  is_published: boolean;
  created_at: Date;
  updated_at: Date;
}

// Paramètres de cookies
export interface CookieSettings {
  id: string;
  necessary_cookies_text: string | null;
  analytics_cookies_text: string | null;
  marketing_cookies_text: string | null;
  preferences_cookies_text: string | null;
  consent_text: string | null;
  created_at: Date;
  updated_at: Date;
}

// Factures
export interface Invoice {
  id: string;
  booking_id: string;
  user_id: string;
  invoice_number: string;
  amount: number;
  amount_ht: number | null;
  amount_ttc: number | null;
  status: 'paid' | 'pending' | 'cancelled';
  issued_date: Date;
  due_date: Date | null;
  paid_date: Date | null;
  created_at: Date;
  updated_at: Date;
}

// Modèles d'emails
export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

// Logs d'emails
export interface EmailLog {
  id: string;
  recipient: string;
  subject: string;
  content: string;
  status: 'sent' | 'failed';
  error: string | null;
  sent_at: Date;
  created_at: Date;
}

// Tickets de support
export interface SupportTicket {
  id: string;
  user_id: string;
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_at: Date;
  updated_at: Date;
}

// Messages de support
export interface SupportMessage {
  id: string;
  ticket_id: string;
  user_id: string;
  message: string;
  is_staff: boolean;
  created_at: Date;
}

// Logs d'application
export interface ApplicationLog {
  id: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  context: Record<string, any> | null;
  timestamp: Date;
  created_at: Date;
}
