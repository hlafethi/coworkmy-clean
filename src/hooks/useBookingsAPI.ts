import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { logger } from '@/utils/logger';

export interface Booking {
  id: string;
  user_id: string;
  space_id: string;
  start_date: string;
  end_date: string;
  total_price: number;
  status: string;
  created_at: string;
  updated_at: string;
  space_name?: string;
  user_name?: string;
}

export const useBookings = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await apiClient.getBookings();
      
      if (result.data) {
        setBookings(result.data);
        logger.log('✅ Réservations chargées:', result.data.length);
      } else {
        setError(result.error || 'Erreur lors du chargement des réservations');
        logger.error('❌ Erreur chargement réservations:', result.error);
      }
    } catch (err) {
      setError('Erreur de connexion');
      logger.error('❌ Erreur chargement réservations:', err);
    } finally {
      setLoading(false);
    }
  };

  const createBooking = async (bookingData: Omit<Booking, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'status'>) => {
    try {
      const result = await apiClient.createBooking(bookingData);
      
      if (result.data) {
        setBookings(prev => [result.data, ...prev]);
        logger.log('✅ Réservation créée:', result.data.id);
        return { success: true, data: result.data };
      } else {
        logger.error('❌ Erreur création réservation:', result.error);
        return { success: false, error: result.error };
      }
    } catch (err) {
      logger.error('❌ Erreur création réservation:', err);
      return { success: false, error: 'Erreur de connexion' };
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  return {
    bookings,
    loading,
    error,
    refetch: fetchBookings,
    createBooking
  };
};
