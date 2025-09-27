import type { 
  Space, 
  Booking, 
  Profile, 
  ProfileDocument, 
  CommunityAnnouncement,
  Payment,
  Role,
  Setting,
  UserSetting,
  UserRole,
  UserSubscription,
  UserToken,
  UserWallet,
  UserWishlistItemComment,
  UserWishlistItemLike,
  UserWishlistItem,
  UserWishlistItemShare,
  UserWishlistItemTag,
  UserWishlist
} from "@/types/database";

// Type guard universel pour tous les objets ayant un id
export function isValid<T extends { id: string }>(obj: any): obj is T {
  return obj && typeof obj === 'object' && typeof obj.id === 'string';
}

// Type guard pour les profils utilisateurs
export function isValidProfile(obj: any): obj is Profile {
  if (!isValid<Profile>(obj)) return false;
  return (
    (obj.first_name === undefined || typeof obj.first_name === 'string') &&
    (obj.last_name === undefined || typeof obj.last_name === 'string')
  );
}

// Type guard pour les réservations
export function isValidBooking(obj: any): obj is Booking {
  if (!isValid<Booking>(obj)) return false;
  return (
    typeof obj.user_id === 'string' &&
    typeof obj.space_id === 'string' &&
    typeof obj.start_time === 'string' &&
    typeof obj.end_time === 'string' &&
    typeof obj.status === 'string'
  );
}

// Type guard pour les espaces
export function isValidSpace(obj: any): obj is Space {
  if (!isValid<Space>(obj)) return false;
  return (
    typeof obj.name === 'string' &&
    typeof obj.pricing_type === 'string'
  );
}

// Type guard pour les documents
export function isValidDocument(obj: any): obj is ProfileDocument {
  if (!isValid<ProfileDocument>(obj)) return false;
  return (
    typeof obj.file_name === 'string' &&
    typeof obj.file_url === 'string'
  );
}

export function isValidCommunityAnnouncement(announcement: any): announcement is CommunityAnnouncement {
  return (
    announcement &&
    typeof announcement === 'object' &&
    typeof announcement.id === 'string' &&
    typeof announcement.title === 'string' &&
    typeof announcement.content === 'string' &&
    typeof announcement.created_at === 'string' &&
    typeof announcement.updated_at === 'string' &&
    (announcement.author_id === null || typeof announcement.author_id === 'string') &&
    (announcement.image_url === null || typeof announcement.image_url === 'string')
  );
}

export function isValidPayment(payment: any): payment is Payment {
  return (
    payment &&
    typeof payment === 'object' &&
    typeof payment.id === 'string' &&
    typeof payment.booking_id === 'string' &&
    typeof payment.amount === 'number' &&
    typeof payment.currency === 'string' &&
    typeof payment.status === 'string' &&
    typeof payment.created_at === 'string' &&
    typeof payment.updated_at === 'string' &&
    (payment.stripe_payment_id === null || typeof payment.stripe_payment_id === 'string') &&
    (payment.stripe_customer_id === null || typeof payment.stripe_customer_id === 'string')
  );
}

export function isValidRole(role: any): role is Role {
  return (
    role &&
    typeof role === 'object' &&
    typeof role.id === 'string' &&
    typeof role.name === 'string' &&
    typeof role.description === 'string' &&
    typeof role.permissions === 'object' &&
    typeof role.created_at === 'string' &&
    typeof role.updated_at === 'string'
  );
}

export function isValidSetting(setting: any): setting is Setting {
  return (
    setting &&
    typeof setting === 'object' &&
    typeof setting.id === 'string' &&
    typeof setting.key === 'string' &&
    typeof setting.value === 'string' &&
    typeof setting.description === 'string' &&
    typeof setting.created_at === 'string' &&
    typeof setting.updated_at === 'string'
  );
}

export function isValidUserSetting(value: unknown): value is UserSetting {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof (value as UserSetting).id === "string" &&
    "user_id" in value &&
    typeof (value as UserSetting).user_id === "string" &&
    "key" in value &&
    typeof (value as UserSetting).key === "string" &&
    "value" in value &&
    typeof (value as UserSetting).value === "string" &&
    "created_at" in value &&
    typeof (value as UserSetting).created_at === "string" &&
    "updated_at" in value &&
    typeof (value as UserSetting).updated_at === "string"
  );
}

export function isValidUserRole(value: unknown): value is UserRole {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof (value as UserRole).id === "string" &&
    "user_id" in value &&
    typeof (value as UserRole).user_id === "string" &&
    "role_id" in value &&
    typeof (value as UserRole).role_id === "string" &&
    "created_at" in value &&
    typeof (value as UserRole).created_at === "string" &&
    "updated_at" in value &&
    typeof (value as UserRole).updated_at === "string"
  );
}

export function isValidUserSubscription(value: unknown): value is UserSubscription {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof (value as UserSubscription).id === "string" &&
    "user_id" in value &&
    typeof (value as UserSubscription).user_id === "string" &&
    "subscription_id" in value &&
    typeof (value as UserSubscription).subscription_id === "string" &&
    "status" in value &&
    typeof (value as UserSubscription).status === "string" &&
    ["active", "cancelled", "expired"].includes((value as UserSubscription).status) &&
    "start_date" in value &&
    typeof (value as UserSubscription).start_date === "string" &&
    "end_date" in value &&
    typeof (value as UserSubscription).end_date === "string" &&
    "created_at" in value &&
    typeof (value as UserSubscription).created_at === "string" &&
    "updated_at" in value &&
    typeof (value as UserSubscription).updated_at === "string"
  );
}

export function isValidUserToken(value: unknown): value is UserToken {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof (value as UserToken).id === "string" &&
    "user_id" in value &&
    typeof (value as UserToken).user_id === "string" &&
    "token" in value &&
    typeof (value as UserToken).token === "string" &&
    "type" in value &&
    typeof (value as UserToken).type === "string" &&
    ["access", "refresh", "reset", "verification"].includes((value as UserToken).type) &&
    "expires_at" in value &&
    typeof (value as UserToken).expires_at === "string" &&
    "created_at" in value &&
    typeof (value as UserToken).created_at === "string" &&
    "updated_at" in value &&
    typeof (value as UserToken).updated_at === "string"
  );
}

export function isValidUserWallet(value: unknown): value is UserWallet {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof (value as UserWallet).id === "string" &&
    "user_id" in value &&
    typeof (value as UserWallet).user_id === "string" &&
    "balance" in value &&
    typeof (value as UserWallet).balance === "number" &&
    "currency" in value &&
    typeof (value as UserWallet).currency === "string" &&
    "status" in value &&
    typeof (value as UserWallet).status === "string" &&
    ["active", "frozen", "closed"].includes((value as UserWallet).status) &&
    "last_transaction_at" in value &&
    typeof (value as UserWallet).last_transaction_at === "string" &&
    "created_at" in value &&
    typeof (value as UserWallet).created_at === "string" &&
    "updated_at" in value &&
    typeof (value as UserWallet).updated_at === "string"
  );
}

export function isValidUserWishlistItemComment(value: unknown): value is UserWishlistItemComment {
  if (!value || typeof value !== "object") return false;
  const obj = value as UserWishlistItemComment;
  return (
    typeof obj.id === "string" &&
    typeof obj.user_id === "string" &&
    typeof obj.wishlist_item_id === "string" &&
    typeof obj.content === "string" &&
    typeof obj.is_private === "boolean" &&
    typeof obj.created_at === "string" &&
    typeof obj.updated_at === "string"
  );
}

export function isValidUserWishlistItemLike(value: unknown): value is UserWishlistItemLike {
  if (!value || typeof value !== "object") return false;
  const obj = value as UserWishlistItemLike;
  return (
    typeof obj.id === "string" &&
    typeof obj.user_id === "string" &&
    typeof obj.wishlist_item_id === "string" &&
    typeof obj.created_at === "string" &&
    typeof obj.updated_at === "string"
  );
}

export function isValidUserWishlistItem(value: unknown): value is UserWishlistItem {
  if (!value || typeof value !== "object") return false;
  const obj = value as UserWishlistItem;
  return (
    typeof obj.id === "string" &&
    typeof obj.user_id === "string" &&
    typeof obj.wishlist_id === "string" &&
    typeof obj.title === "string" &&
    typeof obj.description === "string" &&
    typeof obj.price === "number" &&
    typeof obj.currency === "string" &&
    typeof obj.url === "string" &&
    typeof obj.image_url === "string" &&
    typeof obj.priority === "number" &&
    typeof obj.is_public === "boolean" &&
    ["pending", "reserved", "purchased"].includes(obj.status) &&
    typeof obj.created_at === "string" &&
    typeof obj.updated_at === "string"
  );
}

export function isValidUserWishlistItemShare(value: unknown): value is UserWishlistItemShare {
  if (!value || typeof value !== "object") return false;
  const obj = value as UserWishlistItemShare;
  return (
    typeof obj.id === "string" &&
    typeof obj.user_id === "string" &&
    typeof obj.wishlist_item_id === "string" &&
    typeof obj.shared_with_user_id === "string" &&
    ["view", "edit", "admin"].includes(obj.permission) &&
    (obj.expires_at === null || typeof obj.expires_at === "string") &&
    typeof obj.created_at === "string" &&
    typeof obj.updated_at === "string"
  );
}

export function isValidUserWishlistItemTag(value: unknown): value is UserWishlistItemTag {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof (value as UserWishlistItemTag).id === "string" &&
    "user_id" in value &&
    typeof (value as UserWishlistItemTag).user_id === "string" &&
    "wishlist_item_id" in value &&
    typeof (value as UserWishlistItemTag).wishlist_item_id === "string" &&
    "name" in value &&
    typeof (value as UserWishlistItemTag).name === "string" &&
    "color" in value &&
    typeof (value as UserWishlistItemTag).color === "string" &&
    "created_at" in value &&
    typeof (value as UserWishlistItemTag).created_at === "string" &&
    "updated_at" in value &&
    typeof (value as UserWishlistItemTag).updated_at === "string"
  );
}

export function isValidUserWishlist(value: unknown): value is UserWishlist {
  if (!isValid<UserWishlist>(value)) return false;
  const wishlist = value as UserWishlist;
  return (
    typeof wishlist.user_id === "string" &&
    typeof wishlist.name === "string" &&
    (typeof wishlist.description === "string" || wishlist.description === null) &&
    typeof wishlist.is_private === "boolean" &&
    typeof wishlist.status === "string" &&
    ["active", "archived", "deleted"].includes(wishlist.status) &&
    typeof wishlist.created_at === "string" &&
    typeof wishlist.updated_at === "string"
  );
} 