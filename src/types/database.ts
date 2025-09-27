import type { Database } from './database.types';

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Space = {
  id: string;
  name: string;
  pricing_type: string;
  description: string | null;
  status?: string;
};

export type Booking = {
  id: string;
  user_id: string;
  space_id: string;
  start_time: string;
  end_time: string;
  status: string;
};

export type ProfileDocument = {
  id: string;
  file_name: string;
  file_url: string;
};

export type CommunityAnnouncement = {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  author_id: string | null;
  image_url: string | null;
};

export type Payment = {
  id: string;
  booking_id: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
  updated_at: string;
  stripe_payment_id: string | null;
  stripe_customer_id: string | null;
};

export type Role = {
  id: string;
  name: string;
  description: string;
  permissions: Record<string, any>;
  created_at: string;
  updated_at: string;
};

export type Setting = {
  id: string;
  key: string;
  value: string;
  description: string;
  created_at: string;
  updated_at: string;
};

export type UserSetting = {
  id: string;
  user_id: string;
  key: string;
  value: string;
  created_at: string;
  updated_at: string;
};

export type UserRole = {
  id: string;
  user_id: string;
  role_id: string;
  created_at: string;
  updated_at: string;
};

export type UserSubscription = {
  id: string;
  user_id: string;
  subscription_id: string;
  status: 'active' | 'cancelled' | 'expired';
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
};

export type UserToken = {
  id: string;
  user_id: string;
  token: string;
  type: 'access' | 'refresh' | 'reset' | 'verification';
  expires_at: string;
  created_at: string;
  updated_at: string;
};

export type UserWallet = {
  id: string;
  user_id: string;
  balance: number;
  currency: string;
  status: 'active' | 'frozen' | 'closed';
  last_transaction_at: string;
  created_at: string;
  updated_at: string;
};

export type UserWishlistItemComment = {
  id: string;
  user_id: string;
  wishlist_item_id: string;
  content: string;
  is_private: boolean;
  created_at: string;
  updated_at: string;
};

export type UserWishlistItemLike = {
  id: string;
  user_id: string;
  wishlist_item_id: string;
  created_at: string;
  updated_at: string;
};

export type UserWishlistItem = {
  id: string;
  user_id: string;
  wishlist_id: string;
  title: string;
  description: string | null;
  url: string | null;
  image_url: string | null;
  price: number | null;
  currency: string | null;
  priority: number;
  is_public: boolean;
  status: 'active' | 'archived' | 'deleted';
  created_at: string;
  updated_at: string;
};

export type UserWishlistItemShare = {
  id: string;
  user_id: string;
  wishlist_item_id: string;
  shared_with_user_id: string;
  permission: 'read' | 'write' | 'admin';
  expires_at: string;
  created_at: string;
  updated_at: string;
};

export type UserWishlistItemTag = {
  id: string;
  user_id: string;
  wishlist_item_id: string;
  name: string;
  color: string;
  created_at: string;
  updated_at: string;
};

export type UserWishlist = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  is_private: boolean;
  status: 'active' | 'archived' | 'deleted';
  created_at: string;
  updated_at: string;
}; 