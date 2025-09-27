export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      admin_settings: {
        Row: {
          id: string
          site_name: string
          contact_email: string
          phone_number: string
          hero_title: string
          hero_subtitle: string
          cta_text: string
          features_title: string
          features_subtitle: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          site_name?: string
          contact_email?: string
          phone_number?: string
          hero_title?: string
          hero_subtitle?: string
          cta_text?: string
          features_title?: string
          features_subtitle?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          site_name?: string
          contact_email?: string
          phone_number?: string
          hero_title?: string
          hero_subtitle?: string
          cta_text?: string
          features_title?: string
          features_subtitle?: string
          created_at?: string
          updated_at?: string
        }
      }
      cookie_settings: {
        Row: {
          id: string
          title: string
          description: string
          accept_button_text: string
          reject_button_text: string
          settings_button_text: string
          necessary_cookies_title: string
          necessary_cookies_description: string
          analytics_cookies_title: string
          analytics_cookies_description: string
          marketing_cookies_title: string
          marketing_cookies_description: string
          privacy_policy_url: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title?: string
          description?: string
          accept_button_text?: string
          reject_button_text?: string
          settings_button_text?: string
          necessary_cookies_title?: string
          necessary_cookies_description?: string
          analytics_cookies_title?: string
          analytics_cookies_description?: string
          marketing_cookies_title?: string
          marketing_cookies_description?: string
          privacy_policy_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          accept_button_text?: string
          reject_button_text?: string
          settings_button_text?: string
          necessary_cookies_title?: string
          necessary_cookies_description?: string
          analytics_cookies_title?: string
          analytics_cookies_description?: string
          marketing_cookies_title?: string
          marketing_cookies_description?: string
          privacy_policy_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      bookings: {
        Row: {
          id: string
          user_id: string
          space_id: string
          start_time: string
          end_time: string
          total_price_ht: number
          total_price_ttc: number
          status: 'pending' | 'confirmed' | 'cancelled'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          space_id: string
          start_time: string
          end_time: string
          total_price_ht: number
          total_price_ttc: number
          status?: 'pending' | 'confirmed' | 'cancelled'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          space_id?: string
          start_time?: string
          end_time?: string
          total_price_ht?: number
          total_price_ttc?: number
          status?: 'pending' | 'confirmed' | 'cancelled'
          created_at?: string
          updated_at?: string
        }
      }
      spaces: {
        Row: {
          id: string
          name: string
          description: string
          capacity: number
          hourly_price: number
          daily_price: number
          monthly_price: number
          yearly_price: number
          half_day_price: number
          quarter_price: number
          custom_price: number
          custom_label: string
          pricing_type: 'hourly' | 'daily' | 'monthly' | 'yearly' | 'half_day' | 'quarter' | 'custom'
          image_url: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string
          capacity: number
          hourly_price?: number
          daily_price?: number
          monthly_price?: number
          yearly_price?: number
          half_day_price?: number
          quarter_price?: number
          custom_price?: number
          custom_label?: string
          pricing_type?: 'hourly' | 'daily' | 'monthly' | 'yearly' | 'half_day' | 'quarter' | 'custom'
          image_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          capacity?: number
          hourly_price?: number
          daily_price?: number
          monthly_price?: number
          yearly_price?: number
          half_day_price?: number
          quarter_price?: number
          custom_price?: number
          custom_label?: string
          pricing_type?: 'hourly' | 'daily' | 'monthly' | 'yearly' | 'half_day' | 'quarter' | 'custom'
          image_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          user_id: string
          full_name: string
          company_name: string | null
          phone_number: string | null
          is_admin: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          full_name: string
          company_name?: string | null
          phone_number?: string | null
          is_admin?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          full_name?: string
          company_name?: string | null
          phone_number?: string | null
          is_admin?: boolean
          created_at?: string
          updated_at?: string
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
  }
}
