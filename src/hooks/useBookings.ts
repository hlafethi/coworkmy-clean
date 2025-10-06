import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { createChannel, removeChannel } from "@/lib/websocketManager";
import { logger } from '@/utils/logger';

interface Booking {
  id: string;
  space_id: string;
  user_id: string;
  start_time: string;
  end_time: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  total_price: number;
  created_at: string;
  updated_at: string;
  spaces?: {
    id: string;
    name: string;
    description: string | null;
    capacity: number;
    hourly_price: number;
    daily_price: number;
    monthly_price: number;
    yearly_price: number;
    half_day_price: number;
    quarter_price: number;
    custom_price: number;
    custom_label: string;
    image_url: string;
    pricing_type: string;
  };
  profiles?: {
    id: string;
    full_name: string | null;
    email: string;
  };
}

export function useBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const initialized = useRef(false);

  const loadBookings = useCallback(async () => {
    try {
      logger.debug("🔄 Chargement des réservations...");
      setError(null);
      
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          spaces (
            id,
            name,
            description,
            capacity,
            hourly_price,
            daily_price,
            monthly_price,
            yearly_price,
            half_day_price,
            quarter_price,
            custom_price,
            custom_label,
            image_url,
            pricing_type
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!data || data.length === 0) {
        logger.debug("ℹ️ Aucune réservation trouvée");
        setBookings([]);
      } else {
        logger.debug(`✅ ${data.length} réservations chargées`);
        setBookings(data);
      }
    } catch (error) {
      logger.error("❌ Erreur lors du chargement des réservations:", error);
      setError("Erreur lors du chargement des réservations");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    loadBookings();

    createChannel('bookings_changes', 'bookings', () => {
      loadBookings();
    });
    createChannel('spaces_for_bookings_changes', 'spaces', () => {
      loadBookings();
    });
    createChannel('time_slots_for_bookings_changes', 'time_slots', () => {
      loadBookings();
    });

    return () => {
      removeChannel('bookings_changes');
      removeChannel('spaces_for_bookings_changes');
      removeChannel('time_slots_for_bookings_changes');
    };
  }, [loadBookings]);

  return { 
    bookings, 
    loading, 
    error, 
    refetch: loadBookings 
  };
} 