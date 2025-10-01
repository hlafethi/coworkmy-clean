import { z } from 'zod';

// Homepage Settings
export interface HomepageSettingsRow {
  id: string;
  hero_title: string;
  hero_subtitle: string;
  hero_background_image: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}
export type HomepageSettingsInsert = Omit<HomepageSettingsRow, 'id' | 'created_at' | 'updated_at'>;
export type HomepageSettingsUpdate = Partial<HomepageSettingsInsert>;

export const homepageSettingsSchema = z.object({
  hero_title: z.string().min(1),
  hero_subtitle: z.string().min(1),
  hero_background_image: z.string().url().nullable(),
  is_published: z.boolean().default(false),
});

// Site Settings
export interface SiteSettingsRow {
  id: string;
  site_name: string;
  contact_email: string;
  phone_number: string | null;
  workspace_title: string | null;
  created_at: string;
  updated_at: string;
}
export type SiteSettingsInsert = Omit<SiteSettingsRow, 'id' | 'created_at' | 'updated_at'>;
export type SiteSettingsUpdate = Partial<SiteSettingsInsert>;

export const siteSettingsSchema = z.object({
  site_name: z.string().min(1),
  contact_email: z.string().email(),
  phone_number: z.string().nullable(),
  workspace_title: z.string().nullable(),
});

// Stripe Settings
export interface StripeSettingsRow {
  id: string;
  test_publishable_key: string | null;
  test_secret_key: string | null;
  webhook_secret: string | null;
  live_publishable_key: string | null;
  live_secret_key: string | null;
  live_webhook_secret: string | null;
  mode: 'test' | 'live' | null;
  created_at: string;
  updated_at: string;
}
export type StripeSettingsInsert = Omit<StripeSettingsRow, 'id' | 'created_at' | 'updated_at'>;
export type StripeSettingsUpdate = Partial<StripeSettingsInsert>;

export const stripeSettingsSchema = z.object({
  test_publishable_key: z.string().nullable(),
  test_secret_key: z.string().nullable(),
  webhook_secret: z.string().nullable(),
  live_publishable_key: z.string().nullable(),
  live_secret_key: z.string().nullable(),
  live_webhook_secret: z.string().nullable(),
  mode: z.enum(['test', 'live']).nullable(),
});

// Google Reviews Settings
export interface GoogleReviewsSettingsRow {
  id: string;
  api_key: string;
  place_id: string;
  max_reviews: number;
  min_rating: number;
  created_at: string;
  updated_at: string;
}

export const googleReviewsSettingsSchema = z.object({
  api_key: z.string().min(1, "La clé API est requise"),
  place_id: z.string().min(1, "L'ID du lieu est requis"),
  max_reviews: z.number().min(1).max(100),
  min_rating: z.number().min(1).max(5),
});

export interface SettingsFormValues {
  homepage: {
    title: string;
    description: string;
    hero_title: string;
    hero_subtitle: string;
    hero_background_image: string;
    cta_text: string;
    features_title: string;
    features_subtitle: string;
    cta_section_title: string;
    cta_section_subtitle: string;
    cta_secondary_button_text: string;
    is_published: boolean;
  };
  company: {
    name: string;
    email: string;
    phone: string;
    address: string;
    website: string;
    description: string;
    logo_url: string;
    siret: string;
    vat_number: string;
  };
  stripe?: {
    mode: 'test' | 'live';
    test_publishable_key: string;
    test_secret_key: string;
    webhook_secret: string;
    live_publishable_key: string;
    live_secret_key: string;
    live_webhook_secret: string;
  };
  google_reviews?: {
    api_key: string;
    place_id: string;
    max_reviews: number;
    min_rating: number;
  };
} 