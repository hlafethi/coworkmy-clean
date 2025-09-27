export interface TimeSlotOption {
  id: string;
  startTime: string;
  endTime: string;
  price: number;
  isAvailable: boolean;
  label?: string;
  priceMissing?: boolean;
}

export interface Space {
  id: string;
  name: string;
  description: string;
  price: number;
  capacity: number;
  image_url: string;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export interface Booking {
  id: string;
  space_id: string;
  user_id: string;
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  total_price: number;
  created_at: string;
  updated_at: string;
  space?: Space;
} 