import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

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
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      setIsAuthenticated(!!user);
      return !!user;
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

      const { data, error } = await supabase
        .from('email_config')
        .select('*')
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Aucune configuration trouvée, utiliser les valeurs par défaut
          console.log('📧 Aucune configuration email trouvée, utilisation des valeurs par défaut');
          setConfig(DEFAULT_CONFIG);
          return;
        }
        throw error;
      }

      setConfig(data);
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

      const { data, error } = await supabase
        .from('email_config')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', config.id)
        .select()
        .single();

      if (error) throw error;

      setConfig(data);
      return { success: true, data };
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

      const { data, error } = await supabase
        .from('email_config')
        .insert({
          ...newConfig,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      setConfig(data);
      return { success: true, data };
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