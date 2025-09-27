import type { Space } from "@/components/admin/types";

export type Profile = {
  id: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  [key: string]: any;
};

export type Booking = {
  id: string;
  user_id: string;
  space_id: string;
  start_time: string;
  end_time: string;
  total_price?: number;
  total_price_ht: number;
  total_price_ttc: number;
  status: string;
  created_at: string;
  updated_at: string;
  user_email?: string;
  user_name?: string;
  space_name?: string;
  space_pricing_type?: string;
  spaces?: Space;
  profiles?: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  };
  users?: {
    email: string;
  };
};

export type BookingRPC = {
  id: string;
  user_id: string;
  space_id: string;
  start_time: string;
  end_time: string;
  total_price: string;
  status: string;
  created_at: string;
  updated_at: string;
  space_name: string;
  user_first_name: string;
  user_last_name: string;
};
