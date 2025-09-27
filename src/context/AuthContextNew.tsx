import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { logger } from '@/utils/logger';

interface AuthContextType {
  user: User | null | undefined;
  profile: any;
  loading: boolean;
  isAdmin: boolean;
  profileLoaded: boolean;
  profileError: string | null;
  retryProfileFetch: () => Promise<void>;
  updateProfile: (updates: Partial<any>) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  
  const mounted = useRef(true);

  // Récupération du profil avec REST + fallback Supabase
  const fetchProfile = async (authUser: User) => {
    try {
      // 1. Récupérer le token - Version alternative directe localStorage
      let accessToken = null;
      
      // Essayer différentes clés possibles pour Supabase
      const possibleKeys = [
        'coworkmy-auth-token',
        'coworkmy-auth-session',
        'sb-exffryodynkyizbeesbt-auth-token',
        'supabase.auth.token',
        'supabase.auth.session'
      ];
      
      for (const key of possibleKeys) {
        const data = localStorage.getItem(key);
        if (data) {
          try {
            // Essayer de parser une première fois
            let parsed = JSON.parse(data);
            
            // Si c'est un tableau (caractères), essayer de parser une deuxième fois
            if (Array.isArray(parsed)) {
              const jsonString = parsed.join('');
              parsed = JSON.parse(jsonString);
            }
            // Si c'est une chaîne, essayer de parser une deuxième fois
            else if (typeof parsed === 'string') {
              parsed = JSON.parse(parsed);
            }
            
            if (parsed.access_token) {
              accessToken = parsed.access_token;
              break;
            }
          } catch (e) {
            // Ignorer les erreurs de parsing
          }
        }
      }
      
      // Si pas de token dans localStorage, essayer getSession avec timeout
      if (!accessToken) {
        try {
          const sessionPromise = supabase.auth.getSession();
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout getSession')), 3000)
          );
          
          const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]) as any;
          
          if (session) {
            accessToken = session.access_token;
          }
        } catch (error) {
          // Ignorer les erreurs de timeout
        }
      }
      
      if (!accessToken) {
        return null;
      }
      
      // 2. Requête REST - Utiliser 'id' au lieu de 'user_id'
      const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/profiles?id=eq.${authUser.id}&select=*`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        }
      });
      
      if (!response.ok) {
        return null;
      }
      
      const data = await response.json();
      
      if (data && data.length > 0) {
        return data[0];
      }
      
      // 3. Fallback requête Supabase - Utiliser 'id' au lieu de 'user_id'
      const { data: supaData, error: supaError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();
      
      if (!supaError && supaData) {
        return supaData;
      }
      
      return null;
      
    } catch (error) {
      return null;
    }
  };

  const fetchProfileAndSetState = async (authUser: User) => {
    try {
      logger.info('🔍 Récupération du profil pour:', authUser.id);
      let profile = await fetchProfile(authUser);
      
      if (!profile) {
        logger.warn('❌ Profil non trouvé pour:', authUser.id);
        setIsAdmin(false);
        setProfileError('Profil non trouvé');
        setProfileLoaded(true);
        setLoading(false);
        logger.info('🔄 État mis à jour: profileLoaded=true, loading=false (profil non trouvé)');
        return;
      }
      
      const userIsAdmin = profile?.is_admin === true || profile?.is_admin === 'true';
      
      if (mounted.current) {
        logger.info('✅ Profil récupéré avec succès:', profile.id);
        logger.info('🔄 Mise à jour de l\'état avec profileLoaded=true, loading=false');
        setProfile(profile);
        setIsAdmin(userIsAdmin);
        setProfileError(null);
        setProfileLoaded(true);
        setLoading(false);
        logger.info('✅ État mis à jour avec succès');
      } else {
        logger.warn('⚠️ Composant démonté, pas de mise à jour d\'état');
      }
      
    } catch (error) {
      logger.error('❌ Erreur lors du chargement du profil:', error);
      if (mounted.current) {
        setIsAdmin(false);
        setProfileError('Erreur lors du chargement du profil');
        setProfileLoaded(true);
        setLoading(false);
        logger.info('🔄 État mis à jour: profileLoaded=true, loading=false (erreur)');
      }
    }
  };

  const retryProfileFetch = async () => {
    if (user) {
      await fetchProfileAndSetState(user);
    }
  };

  const updateProfile = (updates: Partial<any>) => {
    if (mounted.current && profile) {
      setProfile(prev => ({
        ...prev,
        ...updates
      }));
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setIsAdmin(false);
    setProfileLoaded(false);
    setProfileError(null);
  };

  useEffect(() => {
    mounted.current = true;
    
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        if (session && session.user) {
          setUser(session.user);
          await fetchProfileAndSetState(session.user);
        } else {
          setUser(null);
          setProfile(null);
          setIsAdmin(false);
          setProfileLoaded(false);
          setLoading(false);
        }
      }
    );
    
    // Initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && session.user) {
        setUser(session.user);
        fetchProfileAndSetState(session.user);
      } else {
        setUser(null);
        setProfile(null);
        setIsAdmin(false);
        setProfileLoaded(false);
        setLoading(false);
      }
    });
    
    return () => {
      mounted.current = false;
      authListener?.subscription.unsubscribe();
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
      updateProfile, 
      signOut 
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