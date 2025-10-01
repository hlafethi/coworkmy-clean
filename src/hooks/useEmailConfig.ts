import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';

export interface EmailConfig {
  id: string;
  smtp_host: string;
  smtp_port: number;
  smtp_username: string;
  smtp_secure: boolean;
  from_email: string;
  from_name: string;
  reply_to_email?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const DEFAULT_CONFIG: EmailConfig = {
  id: 'default',
  smtp_host: 'smtp.gmail.com',
  smtp_port: 587,
  smtp_username: '',
  smtp_secure: true,
  from_email: 'noreply@coworkmy.com',
  from_name: 'CoWorkMy',
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

export const useEmailConfig = () => {
  const [config, setConfig] = useState<EmailConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const checkAuth = async () => {
    try {
      // Vérifier si l'utilisateur est connecté via le token JWT
      const token = localStorage.getItem('token');
      if (!token) {
        setIsAuthenticated(false);
        return false;
      }
      setIsAuthenticated(true);
      return true;
    } catch (err) {
      console.error('❌ Erreur de vérification d\'authentification:', err);
      setIsAuthenticated(false);
      return false;
    }
  };

  const fetchConfig = async () => {
    try {
      setLoading(true);
      setError(null);

      const isAuth = await checkAuth();
      if (!isAuth) {
        throw new Error('Utilisateur non authentifié');
      }

      const result = await apiClient.get('/email-config');

      if (result.success && result.data) {
        setConfig(result.data);
      } else {
        // Aucune configuration trouvée, utiliser les valeurs par défaut
        console.log('📧 Aucune configuration email trouvée, utilisation des valeurs par défaut');
        setConfig(DEFAULT_CONFIG);
      }
    } catch (err: any) {
      console.error('❌ Erreur lors du chargement de la config email:', err);
      setError(err.message);
      setConfig(DEFAULT_CONFIG);
    } finally {
      setLoading(false);
    }
  };

  const updateConfig = async (updates: Partial<EmailConfig>) => {
    if (!config) return { success: false, error: 'Aucune configuration trouvée' };

    try {
      const isAuth = await checkAuth();
      if (!isAuth) {
        throw new Error('Utilisateur non authentifié');
      }

      const result = await apiClient.put(`/email-config/${config.id}`, {
        ...updates,
        updated_at: new Date().toISOString()
      });

      if (result.success && result.data) {
        setConfig(result.data);
        return { success: true, data: result.data };
      } else {
        throw new Error(result.message || 'Erreur lors de la mise à jour');
      }
    } catch (err: any) {
      console.error('❌ Erreur lors de la mise à jour:', err);
      return { success: false, error: err.message };
    }
  };

  const createConfig = async (newConfig: Omit<EmailConfig, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const isAuth = await checkAuth();
      if (!isAuth) {
        throw new Error('Utilisateur non authentifié');
      }

      const result = await apiClient.post('/email-config', {
        ...newConfig,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      if (result.success && result.data) {
        setConfig(result.data);
        return { success: true, data: result.data };
      } else {
        throw new Error(result.message || 'Erreur lors de la création');
      }
    } catch (err: any) {
      console.error('❌ Erreur lors de la création:', err);
      return { success: false, error: err.message };
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  return {
    config: config || DEFAULT_CONFIG,
    loading,
    error,
    isAuthenticated,
    updateConfig,
    createConfig,
    refetch: fetchConfig
  };
}; 