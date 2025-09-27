import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface EmailHistory {
  id: string;
  to_email: string;
  subject: string;
  status: 'pending' | 'sent' | 'failed' | 'bounced' | 'delivered';
  sent_at?: string;
  created_at: string;
  error_message?: string;
  template_id?: string;
  metadata?: Record<string, any>;
}

export const useEmailHistory = (limit: number = 50) => {
  const [emails, setEmails] = useState<EmailHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
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

  const fetchHistory = async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);

      const isAuth = await checkAuth();
      if (!isAuth) {
        throw new Error('Utilisateur non authentifié');
      }

      // Calculer l'offset pour la pagination
      const offset = (page - 1) * limit;

      // Récupérer le nombre total d'emails
      const { count, error: countError } = await supabase
        .from('email_history')
        .select('*', { count: 'exact', head: true });

      if (countError) throw countError;
      setTotalCount(count || 0);

      // Récupérer les emails avec pagination
      const { data, error } = await supabase
        .from('email_history')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      setEmails(data || []);
    } catch (err: any) {
      console.error('❌ Erreur lors du chargement de l\'historique:', err);
      setError(err.message);
      setEmails([]);
    } finally {
      setLoading(false);
    }
  };

  const addEmail = async (email: Omit<EmailHistory, 'id' | 'created_at'>) => {
    try {
      const isAuth = await checkAuth();
      if (!isAuth) {
        throw new Error('Utilisateur non authentifié');
      }

      const { data, error } = await supabase
        .from('email_history')
        .insert({
          ...email,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Mettre à jour la liste des emails
      setEmails(prev => [data, ...prev].slice(0, limit));
      setTotalCount(prev => prev + 1);

      return { success: true, data };
    } catch (err: any) {
      console.error('❌ Erreur lors de l\'ajout de l\'email:', err);
      return { success: false, error: err.message };
    }
  };

  const updateEmailStatus = async (id: string, status: EmailHistory['status'], error_message?: string) => {
    try {
      const isAuth = await checkAuth();
      if (!isAuth) {
        throw new Error('Utilisateur non authentifié');
      }

      const { data, error } = await supabase
        .from('email_history')
        .update({
          status,
          error_message,
          sent_at: status === 'sent' ? new Date().toISOString() : undefined
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Mettre à jour l'email dans la liste
      setEmails(prev => prev.map(email => 
        email.id === id ? data : email
      ));

      return { success: true, data };
    } catch (err: any) {
      console.error('❌ Erreur lors de la mise à jour du statut:', err);
      return { success: false, error: err.message };
    }
  };

  useEffect(() => {
    fetchHistory(1);
  }, [limit]);

  return {
    emails,
    loading,
    error,
    totalCount,
    isAuthenticated,
    fetchHistory,
    addEmail,
    updateEmailStatus
  };
}; 