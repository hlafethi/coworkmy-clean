import { createClient } from '@supabase/supabase-js'
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { logger } from '@/utils/logger';

// Vérification des variables d'environnement pour Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Log de configuration en mode développement uniquement
if (import.meta.env.MODE === 'development') {
  logger.log('🔧 Configuration Supabase:', {
    url: supabaseUrl,
    hasKey: !!supabaseAnonKey,
    keyPreview: supabaseAnonKey?.substring(0, 20) + '...',
    mode: import.meta.env.MODE
  });
}

// Vérification des variables d'environnement - mode gracieux
if (!supabaseUrl || !supabaseAnonKey) {
  logger.log('ℹ️ Configuration Supabase manquante - utilisation de PostgreSQL par défaut');
  // Ne pas lancer d'erreur, utiliser PostgreSQL à la place
}

// Client Supabase avec configuration sécurisée (singleton)
let supabaseInstance: ReturnType<typeof createClient> | null = null;

export const supabase = (() => {
  if (!supabaseInstance && supabaseUrl && supabaseAnonKey) {
    supabaseInstance = createClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
          storageKey: 'coworkmy-auth-token',
          storage: {
            getItem: (key) => {
              if (typeof window === 'undefined') return null;
              const value = localStorage.getItem(key);
              return value ? JSON.parse(value) : null;
            },
            setItem: (key, value) => {
              if (typeof window === 'undefined') return;
              localStorage.setItem(key, JSON.stringify(value));
            },
            removeItem: (key) => {
              if (typeof window === 'undefined') return;
              localStorage.removeItem(key);
            }
          }
        }
      }
    );
  }
  return supabaseInstance;
})();

// Client Supabase avec clé service_role pour les fonctions Edge
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
export const supabaseAdmin = supabaseUrl && (supabaseServiceKey || supabaseAnonKey) ? createClient(
  supabaseUrl,
  supabaseServiceKey || supabaseAnonKey, // Fallback sur anon si service_role n'est pas disponible
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
) : null;

// Création d'un client Supabase Storage pour l'upload d'images
export function createStorageClient() {
  return supabase;
}

// Vérifier si Supabase est configuré
export const isSupabaseConfigured = () => {
  return !!(supabaseUrl && supabaseAnonKey);
};

if (isSupabaseConfigured()) {
  logger.log('✅ Client Supabase créé avec PKCE');
} else {
  logger.log('ℹ️ Supabase non configuré - utilisation de PostgreSQL');
}

// Gestion du rafraîchissement des tokens
export const handleTokenRefresh = async () => {
  if (!isSupabaseConfigured() || !supabase) {
    return;
  }
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.auth.refreshSession();
      if (data.session) {
        localStorage.setItem('sb-auth-token', data.session.access_token);
      }
    }
  } catch (error) {
    logger.error('Erreur lors du rafraîchissement du token:', error);
  }
};

// Observateur d'état d'authentification
export const handleAuthStateChange = async (event: AuthChangeEvent) => {
  if (event === 'TOKEN_REFRESHED') {
    await handleTokenRefresh();
  }
  
  // Gérer les autres événements d'authentification
  switch (event) {
    case 'SIGNED_IN':
      logger.log('Utilisateur connecté');
      break;
    case 'SIGNED_OUT':
      logger.log('Utilisateur déconnecté');
      break;
    case 'USER_UPDATED':
      logger.log('Profil utilisateur mis à jour');
      break;
    case 'PASSWORD_RECOVERY':
      logger.log('Récupération de mot de passe');
      break;
  }
};

// Configuration de l'observateur d'état (seulement si Supabase est configuré)
if (isSupabaseConfigured() && supabase) {
  supabase.auth.onAuthStateChange(handleAuthStateChange);
}

// Log de vérification de la configuration
logger.log('🔒 Configuration de sécurité:', {
  url: import.meta.env.MODE === 'production' ? 'production' : 'development',
  authMethod: 'PKCE',
  storage: typeof window !== 'undefined' ? 'ok' : 'n/a',
  hasSession: typeof window !== 'undefined' ? !!localStorage.getItem('sb-auth-token') : false
});

// Utilitaires session
export const checkSession = async (retries = 3): Promise<Session | null> => {
  if (!isSupabaseConfigured() || !supabase) {
    return null;
  }
  
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  } catch (error) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return checkSession(retries - 1);
    }
    return null;
  }
};

export const refreshSession = async (retries = 3): Promise<Session | null> => {
  if (!isSupabaseConfigured() || !supabase) {
    return null;
  }
  
  try {
    const { data: { session }, error } = await supabase.auth.refreshSession();
    if (error) throw error;
    return session;
  } catch (error) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return refreshSession(retries - 1);
    }
    return null;
  }
};
