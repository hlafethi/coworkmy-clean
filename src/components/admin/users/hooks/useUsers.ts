import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";

export type UserProfile = {
  id: string;
  user_id?: string;
  email?: string;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  company?: string | null;
  created_at?: string;
  updated_at?: string;
  address?: string | null;
  address_street?: string | null;
  address_city?: string | null;
  address_postal_code?: string | null;
  address_country?: string | null;
  birth_date?: string | null;
  profile_picture?: string | null;
  avatar_url?: string | null;
  logo_url?: string | null;
  presentation?: string | null;
  company_name?: string | null;
  full_name?: string | null;
  phone_number?: string | null;
};

export const useUsers = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Pour PostgreSQL, on utilise des données par défaut pour l'instant
      console.log('Fetching users...');
      const response = await apiClient.get('/users');
      
      if (response.success && response.data) {
        const usersData = Array.isArray(response.data) ? response.data : [];
        setUsers(usersData);
      } else {
        // Données par défaut si l'API n'est pas disponible
        setUsers([]);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des profils:', error);
      toast.error("Impossible de récupérer les utilisateurs");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const getUserById = async (userId: string): Promise<UserProfile | null> => {
    if (!userId) {
      toast.error("ID utilisateur manquant");
      return null;
    }
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;
      
      if (!profile) return null;

      return {
        id: profile.id,
        user_id: profile.user_id,
        email: profile.email,
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        phone: profile.phone || '',
        company: profile.company || '',
        created_at: profile.created_at,
        updated_at: profile.updated_at,
        address: profile.address || '',
        address_street: profile.address_street || '',
        address_city: profile.address_city || '',
        address_postal_code: profile.address_postal_code || '',
        address_country: profile.address_country || '',
        birth_date: profile.birth_date || '',
        profile_picture: profile.profile_picture || '',
        avatar_url: profile.avatar_url || '',
        logo_url: profile.logo_url || '',
        presentation: profile.presentation || '',
        company_name: profile.company_name || '',
        full_name: profile.full_name || '',
        phone_number: profile.phone_number || '',
      };
    } catch (error) {
      console.error('Erreur lors de la récupération du profil:', error);
      toast.error("Impossible de récupérer les informations de l'utilisateur");
      return null;
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return { users, loading, fetchUsers, getUserById };
};
