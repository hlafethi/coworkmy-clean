import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { logger } from '@/utils/logger';

export interface Space {
  id: string;
  name: string;
  description?: string;
  capacity: number;
  hourly_price?: number;
  daily_price?: number;
  half_day_price?: number;
  monthly_price?: number;
  quarter_price?: number;
  yearly_price?: number;
  custom_price?: number;
  custom_label?: string;
  pricing_type?: string;
  amenities?: string[];
  image_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useSpaces = () => {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSpaces = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await apiClient.getSpaces();
      
      if (result.data) {
        setSpaces(result.data);
        logger.log('✅ Espaces chargés:', result.data.length);
      } else {
        setError(result.error || 'Erreur lors du chargement des espaces');
        logger.error('❌ Erreur chargement espaces:', result.error);
      }
    } catch (err) {
      setError('Erreur de connexion');
      logger.error('❌ Erreur chargement espaces:', err);
    } finally {
      setLoading(false);
    }
  };

  const createSpace = async (spaceData: Omit<Space, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const result = await apiClient.createSpace(spaceData);
      
      if (result.data) {
        setSpaces(prev => [result.data, ...prev]);
        logger.log('✅ Espace créé:', result.data.id);
        return { success: true, data: result.data };
      } else {
        logger.error('❌ Erreur création espace:', result.error);
        return { success: false, error: result.error };
      }
    } catch (err) {
      logger.error('❌ Erreur création espace:', err);
      return { success: false, error: 'Erreur de connexion' };
    }
  };

  useEffect(() => {
    fetchSpaces();
  }, []);

  return {
    spaces,
    loading,
    error,
    refetch: fetchSpaces,
    createSpace
  };
};
