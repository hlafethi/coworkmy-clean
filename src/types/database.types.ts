export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          user_id: string
          email: string | null
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
          first_name: string | null
          last_name: string | null
          is_admin: boolean
          address: string | null
          address_city: string | null
          address_street: string | null
          address_postal_code: string | null
          address_country: string | null
          birth_date: string | null
          phone: string | null
          company: string | null
          profile_picture: string | null
          logo_url: string | null
          presentation: string | null
          company_name: string | null
          phone_number: string | null
        }
        Insert: {
          id?: string
          user_id: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
          first_name?: string | null
          last_name?: string | null
          is_admin?: boolean
          address?: string | null
          address_city?: string | null
          address_street?: string | null
          address_postal_code?: string | null
          address_country?: string | null
          birth_date?: string | null
          phone?: string | null
          company?: string | null
          profile_picture?: string | null
          logo_url?: string | null
          presentation?: string | null
          company_name?: string | null
          phone_number?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
          first_name?: string | null
          last_name?: string | null
          is_admin?: boolean
          address?: string | null
          address_city?: string | null
          address_street?: string | null
          address_postal_code?: string | null
          address_country?: string | null
          birth_date?: string | null
          phone?: string | null
          company?: string | null
          profile_picture?: string | null
          logo_url?: string | null
          presentation?: string | null
          company_name?: string | null
          phone_number?: string | null
        }
      }
      spaces: {
        Row: {
          id: string
          name: string
          description: string | null
          capacity: number
          price_ht: number | null
          price_ttc: number | null
          image_url: string | null
          created_at: string
          updated_at: string
          stripe_product_id: string | null
          stripe_price_id: string | null
          pricing_type: string | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          capacity: number
          price_ht?: number | null
          price_ttc?: number | null
          image_url?: string | null
          created_at?: string
          updated_at?: string
          stripe_product_id?: string | null
          stripe_price_id?: string | null
          pricing_type?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          capacity?: number
          price_ht?: number | null
          price_ttc?: number | null
          image_url?: string | null
          created_at?: string
          updated_at?: string
          stripe_product_id?: string | null
          stripe_price_id?: string | null
          pricing_type?: string | null
        }
      }
      bookings: {
        Row: {
          id: string
          user_id: string
          space_id: string
          start_date: string
          end_date: string
          status: string
          total_price: number
          created_at: string
          updated_at: string
          stripe_session_id: string | null
        }
        Insert: {
          id?: string
          user_id: string
          space_id: string
          start_date: string
          end_date: string
          status?: string
          total_price: number
          created_at?: string
          updated_at?: string
          stripe_session_id?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          space_id?: string
          start_date?: string
          end_date?: string
          status?: string
          total_price?: number
          created_at?: string
          updated_at?: string
          stripe_session_id?: string | null
        }
      }
      time_slots: {
        Row: {
          id: string
          space_id: string | null
          start_time: string
          end_time: string
          is_available: boolean
          created_at: string
          updated_at: string
          display_order: number | null
        }
        Insert: {
          id?: string
          space_id?: string | null
          start_time: string
          end_time: string
          is_available?: boolean
          created_at?: string
          updated_at?: string
          display_order?: number | null
        }
        Update: {
          id?: string
          space_id?: string | null
          start_time?: string
          end_time?: string
          is_available?: boolean
          created_at?: string
          updated_at?: string
          display_order?: number | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'booking' | 'system' | 'payment' | 'support';
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: string;
  user_id: string;
  space_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  updated_at: string;
}

export interface Promotion {
  id: string;
  code: string;
  description: string;
  discount_percent: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SpaceEquipment {
  id: string;
  space_id: string;
  name: string;
  description: string | null;
  quantity: number;
  created_at: string;
  updated_at: string;
} 