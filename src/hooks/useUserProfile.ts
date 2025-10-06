import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { logger } from '@/utils/logger';

interface UserProfile {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  company?: string;
  city?: string;
  avatar_url?: string;
  presentation?: string;
  created_at?: string;
  updated_at?: string;
}

export function useUserProfile(userId?: string) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        
        logger.debug('👤 Récupération du profil utilisateur:', userId);
        
        const result = await apiClient.get(`/users/${userId}`);
        
        if (result.success && result.data) {
          logger.debug('✅ Profil utilisateur récupéré:', result.data);
          setProfile(result.data);
        } else {
          logger.warn('⚠️ Aucun profil utilisateur trouvé');
          setProfile(null);
        }
      } catch (err) {
        logger.error('❌ Erreur lors du chargement du profil utilisateur:', err);
        setError('Erreur lors du chargement du profil');
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);

  const updateProfile = async (updateData: Partial<UserProfile>) => {
    if (!userId) return false;

    try {
      logger.debug('👤 Mise à jour du profil utilisateur:', userId, updateData);
      
      const result = await apiClient.put(`/users/${userId}`, updateData);
      
      if (result.success && result.data) {
        logger.debug('✅ Profil utilisateur mis à jour:', result.data);
        setProfile(result.data);
        return true;
      } else {
        logger.error('❌ Erreur lors de la mise à jour du profil:', result.error);
        setError(result.error || 'Erreur lors de la mise à jour');
        return false;
      }
    } catch (err) {
      logger.error('❌ Erreur lors de la mise à jour du profil utilisateur:', err);
      setError('Erreur lors de la mise à jour du profil');
      return false;
    }
  };

  return {
    profile,
    loading,
    error,
    updateProfile
  };
}
