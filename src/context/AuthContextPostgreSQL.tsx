import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@/lib/api-client';
import { isSupabaseConfigured } from '@/lib/supabase';
// Logger supprimé - utilisation de console directement
interface User {
  id: string;
  email: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  phone_number?: string;
  company?: string;
  company_name?: string;
  address?: string;
  address_street?: string;
  address_city?: string;
  address_postal_code?: string;
  address_country?: string;
  birth_date?: string;
  presentation?: string;
  profile_picture?: string;
  logo_url?: string;
  avatar_url?: string;
  city?: string;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  profile: User | null;
  loading: boolean;
  isAdmin: boolean;
  profileLoaded: boolean;
  profileError: string | null;
  retryProfileFetch: () => Promise<void>;
  signOut: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ user: User | null; error: string | null }>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ user: User | null; error: string | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  
  const mounted = useRef(true);
  const navigate = useNavigate();

  // Fonction de connexion
  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      console.log('🔐 Tentative de connexion pour:', email);
      
      const result = await apiClient.signIn(email, password);
      console.log('📊 Résultat API:', result);
      console.log('📊 result.success:', result.success);
      console.log('📊 result.data:', result.data);
      console.log('📊 result.data.user:', result.data?.user);
      
      if (result.success && result.data && result.data.user) {
        setUser(result.data.user);
        setProfile(result.data.user);
        setIsAdmin(result.data.user.is_admin);
        setProfileError(null);
        setProfileLoaded(true);
        console.log('✅ Connexion réussie:', { userId: result.data.user.id });
        return { user: result.data.user, error: null };
      } else {
        const errorMessage = result.error || 'Erreur de connexion';
        setProfileError(errorMessage);
        console.error('❌ Erreur de connexion:', errorMessage);
        console.error('❌ Détails du résultat:', result);
        return { user: null, error: errorMessage };
      }
    } catch (error) {
      setProfileError('Erreur de connexion');
      console.error('❌ Erreur de connexion:', error);
      return { user: null, error: 'Erreur de connexion' };
    } finally {
      setLoading(false);
    }
  };

  // Fonction d'inscription
  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      setLoading(true);
      console.log('📝 Tentative d\'inscription pour:', email);
      
      const result = await apiClient.signUp(email, password, fullName);
      console.log('📊 Résultat inscription API:', result);
      
      if (result.success && result.data && result.data.user) {
        setUser(result.data.user);
        setProfile(result.data.user);
        setIsAdmin(result.data.user.is_admin);
        setProfileError(null);
        setProfileLoaded(true);
        console.log('✅ Inscription réussie:', { userId: result.data.user.id });
        return { user: result.data.user, error: null };
      } else {
        const errorMessage = result.error || 'Erreur d\'inscription';
        setProfileError(errorMessage);
        console.error('❌ Erreur d\'inscription:', errorMessage);
        console.error('❌ Détails du résultat:', result);
        return { user: null, error: errorMessage };
      }
    } catch (error) {
      const errorMessage = 'Erreur d\'inscription';
      setProfileError(errorMessage);
      console.error('❌ Erreur d\'inscription:', error);
      return { user: null, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Fonction de déconnexion
  const signOut = async () => {
    try {
      await apiClient.signOut();
      setUser(null);
      setProfile(null);
      setIsAdmin(false);
      setProfileLoaded(false);
      setProfileError(null);
      console.log('🚪 Déconnexion réussie');
      
      // Rediriger vers la homepage après déconnexion
      navigate('/');
    } catch (error) {
      console.error('❌ Erreur de déconnexion:', error);
    }
  };

  // Fonction de retry pour le profil
  const retryProfileFetch = async () => {
    setLoading(true);
    try {
      const result = await apiClient.getCurrentUser();
      if (result.data && result.data.user) {
        setUser(result.data.user);
        setProfile(result.data.user);
        setIsAdmin(result.data.user.is_admin);
        setProfileError(null);
        setProfileLoaded(true);
      } else {
        setProfileError(result.error || 'Erreur lors du rechargement');
      }
    } catch (error) {
      console.error('❌ Erreur lors du rechargement du profil:', error);
      setProfileError('Erreur lors du rechargement du profil');
    } finally {
      setLoading(false);
    }
  };

  // Initialisation de l'authentification
  useEffect(() => {
    mounted.current = true;
    
    const initializeAuth = async () => {
      try {
        setLoading(true);
        
        // Vérifier si Supabase est configuré
        if (isSupabaseConfigured()) {
          console.log('ℹ️ Supabase configuré - utilisation de Supabase Auth');
          // Ici vous pourriez utiliser le contexte Supabase existant
          // Pour l'instant, on utilise PostgreSQL par défaut
        }
        
        // Vérifier la session actuelle via l'API
        const result = await apiClient.getCurrentUser();
        
        if (result.data && result.data.user && mounted.current) {
          setUser(result.data.user);
          setProfile(result.data.user);
          setIsAdmin(result.data.user.is_admin);
          setProfileLoaded(true);
          setProfileError(null);
          console.log('✅ Session restaurée:', { userId: result.data.user.id });
        } else {
          console.log('ℹ️ Aucune session trouvée');
        }
        
      } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation de l\'auth:', error);
        setProfileError('Erreur lors de l\'initialisation');
      } finally {
        if (mounted.current) {
          setLoading(false);
        }
      }
    };

    initializeAuth();
    
    return () => {
      mounted.current = false;
    };
  }, []);

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      loading, 
      isAdmin, 
      profileLoaded, 
      profileError, 
      retryProfileFetch, 
      signOut,
      signIn,
      signUp
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
