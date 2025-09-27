export interface Space {
  id: string;
  name: string;
  description: string | null;
  capacity: number | null;
  created_at: string;
  updated_at: string;
  half_day_price: number | null;
  quarter_price: number | null;
  pricing_type: 'hourly' | 'daily' | 'half_day' | 'monthly' | 'quarter' | 'yearly' | 'custom';
  image_url: string | null;
  is_active: boolean | null;
  hourly_price: number | null;
  daily_price: number | null;
  custom_label: string | null;
  monthly_price: number | null;
  custom_price: number | null;
  features: any | null;
  tags: string[] | null;
  color: string | null;
  order_index: number | null;
  yearly_price: number | null;
  stripe_product_id: string | null;
  stripe_price_id: string | null;
  last_stripe_sync: string | null;
  price_per_hour: number | null;
  created_by: string | null;
}

export interface Booking {
  id: string;
  user_id: string;
  space_id: string;
  start_time: string;
  end_time: string;
  total_price_ht: number;
  total_price_ttc: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  created_at: string;
  updated_at: string;
  space?: Space;
}

export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  company_name: string;
  phone_number: string;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProfileDocument {
  id: string;
  profile_id: string;
  document_type: string;
  document_url: string;
  verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdminSettings {
  id: string;
  site_name: string;
  contact_email: string;
  phone_number: string;
  hero_title: string;
  hero_subtitle: string;
  cta_text: string;
  features_title: string;
  features_subtitle: string;
  created_at: string;
  updated_at: string;
}

export interface GoogleApiSettings {
  id: string;
  place_id: string;
  min_rating: number;
  max_reviews: number;
  created_at: string;
  updated_at: string;
}

export interface CommunityAnnouncement {
  id: string;
  title: string;
  content: string;
  author_id: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface CookieSettings {
  id: string;
  title: string;
  description: string;
  accept_button_text: string;
  reject_button_text: string;
  settings_button_text: string;
  necessary_cookies_title: string;
  necessary_cookies_description: string;
  analytics_cookies_title: string;
  analytics_cookies_description: string;
  marketing_cookies_title: string;
  marketing_cookies_description: string;
  privacy_policy_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  booking_id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'succeeded' | 'failed' | 'refunded';
  stripe_payment_id: string | null;
  stripe_customer_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: {
    can_manage_users: boolean;
    can_manage_roles: boolean;
    can_manage_spaces: boolean;
    can_manage_bookings: boolean;
    can_manage_payments: boolean;
    can_manage_settings: boolean;
  };
  created_at: string;
  updated_at: string;
}

export interface Setting {
  id: string;
  key: string;
  value: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface UserSetting {
  id: string;
  user_id: string;
  key: string;
  value: string;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role_id: string;
  created_at: string;
  updated_at: string;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  subscription_id: string;
  status: "active" | "cancelled" | "expired";
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
}

export interface UserToken {
  id: string;
  user_id: string;
  token: string;
  type: "access" | "refresh" | "reset" | "verification";
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface UserWallet {
  id: string;
  user_id: string;
  balance: number;
  currency: string;
  status: "active" | "frozen" | "closed";
  last_transaction_at: string;
  created_at: string;
  updated_at: string;
}

export interface UserWishlistItemComment {
  id: string;
  user_id: string;
  wishlist_item_id: string;
  content: string;
  is_private: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserWishlistItemLike {
  id: string;
  user_id: string;
  wishlist_item_id: string;
  created_at: string;
  updated_at: string;
}

export interface UserWishlistItem {
  id: string;
  user_id: string;
  wishlist_id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  url: string;
  image_url: string;
  priority: number;
  is_public: boolean;
  status: 'pending' | 'reserved' | 'purchased';
  created_at: string;
  updated_at: string;
}

export interface UserWishlistItemShare {
  id: string;
  item_id: string;
  shared_with_id: string;
  permission: 'view' | 'admin' | 'edit';
  created_at: string;
  updated_at: string;
}

export interface UserWishlistItemTag {
  id: string;
  user_id: string;
  wishlist_item_id: string;
  name: string;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface UserWishlist {
  id: string;
  user_id: string;
  title: string;
  description: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface TimeSlot {
  id: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
  price: number;
  space_id: string;
  label: string;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface TimeSlotOption {
  id: string;
  start_time: string;
  end_time: string;
  duration: number;
  price: number;
  is_available: boolean;
  space_id: string;
  label: string;
  display_order: number;
}
