import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
// Logger supprimé - utilisation de console directement
interface AuthContextType {
  user: User | null;
  profile: any;
  loading: boolean;
  isAdmin: boolean;
  profileLoaded: boolean;
  profileError: string | null;
  retryProfileFetch: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  
  const mounted = useRef(true);

  // Récupération du profil avec REST + fallback Supabase
  const fetchProfile = async (authUser: User) => {
    try {
      console.log('[fetchProfile] Début récupération user_id:', authUser.id);
      
      // 1. Récupérer le token
      let accessToken = null;
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        accessToken = session.access_token;
        console.log('[fetchProfile] Token via supabase.auth.getSession()');
      } else {
        const sessionData = localStorage.getItem('coworkmy-auth-session');
        if (sessionData) {
          try {
            const parsedSession = JSON.parse(sessionData);
            accessToken = parsedSession.access_token;
            console.log('[fetchProfile] Token via localStorage');
          } catch (e) {
            console.error('[fetchProfile] Erreur parsing localStorage', e);
          }
        }
      }
      
      if (!accessToken) {
        console.error('[fetchProfile] Pas de token d\'accès');
        return null;
      }
      
      // 2. Requête REST
      const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/profiles?user_id=eq.${authUser.id}&select=*`;
      console.log('[fetchProfile] Requête REST:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        }
      });
      
      console.log('[fetchProfile] Status REST:', response.status, response.statusText);
      
      if (!response.ok) {
        console.error('[fetchProfile] Erreur HTTP REST:', response.status, response.statusText);
        return null;
      }
      
      const data = await response.json();
      console.log('[fetchProfile] Data REST:', data);
      
      if (data && data.length > 0) {
        console.log('[fetchProfile] Profil trouvé via REST:', data[0]);
        return data[0];
      }
      
      console.warn('[fetchProfile] Aucun profil via REST, fallback Supabase...');
      
      // 3. Fallback requête Supabase
      const { data: supaData, error: supaError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', authUser.id)
        .single();
      
      console.log('[fetchProfile] Fallback Supabase:', { supaData, supaError });
      
      if (!supaError && supaData) {
        return supaData;
      }
      
      console.warn('[fetchProfile] Aucun profil trouvé via fallback Supabase');
      return null;
      
    } catch (error) {
      console.error('[fetchProfile] Exception:', error);
      return null;
    }
  };

  const fetchProfileAndSetState = async (authUser: User) => {
    try {
      console.log('[useAuth] Fetching profile for user:', authUser.id);
      
      let profile = await fetchProfile(authUser);
      console.log('[useAuth] Résultat fetchProfile:', profile);
      
      if (!profile) {
        setIsAdmin(false);
        setProfileError('Profil non trouvé');
        setProfileLoaded(true);
        setLoading(false);
        return;
      }
      
      const userIsAdmin = profile?.is_admin === true || profile?.is_admin === 'true';
      console.log('[useAuth] userIsAdmin:', userIsAdmin);
      
      if (mounted.current) {
        setProfile(profile);
        setIsAdmin(userIsAdmin);
        setProfileError(null);
        setProfileLoaded(true);
        setLoading(false);
      }
      
    } catch (error) {
      console.error('[useAuth] fetchProfileAndSetState Exception:', error);
      
      if (mounted.current) {
        setIsAdmin(false);
        setProfileError('Erreur lors du chargement du profil');
        setProfileLoaded(true);
        setLoading(false);
      }
    }
  };

  const retryProfileFetch = async () => {
    if (user) {
      await fetchProfileAndSetState(user);
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
        console.log('[useAuth] Auth event:', event);
        
        if (session && session.user) {
          setUser(session.user);
          await fetchProfileAndSetState(session.user);
        } else {
          setUser(null);
          setProfile(null);
          setIsAdmin(false);
          setProfileLoaded(false);
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
