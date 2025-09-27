import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { User } from "@supabase/supabase-js";
import { logger } from "@/utils/logger";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const navigate = useNavigate();
  const initialized = useRef(false);
  const mounted = useRef(true);
  const profileFetchAttempts = useRef(0);

  useEffect(() => {
    mounted.current = true;

    const initializeAuth = async () => {
      // Éviter l'initialisation multiple
      if (initialized.current) return;
      initialized.current = true;

      try {
        // Vérifier l'état initial de l'authentification
        const { data: { user: initialUser }, error: initialError } = await supabase.auth.getUser();
        
        if (initialError) {
          // Gérer les différents types d'erreurs
          if (initialError.message.includes('Auth session missing')) {
            // Aucune session active - utilisateur non connecté
          } else if (initialError.message.includes('Invalid JWT') || initialError.message.includes('JWT expired')) {
            // Session expirée ou invalide, nettoyage
            localStorage.removeItem('sb-auth-token');
            localStorage.removeItem('coworkmy-auth-token');
            await supabase.auth.signOut();
          } else {
            logger.error("[useAuth] Error getting initial user:", initialError);
          }
          
          if (mounted.current) {
            setUser(null);
            setIsAdmin(false);
            setProfileLoaded(true);
            setLoading(false);
          }
          return;
        }

        if (initialUser && mounted.current) {
          setUser(initialUser);
          await fetchProfileAndSetState(initialUser);
        } else if (mounted.current) {
          setUser(null);
          setIsAdmin(false);
          setProfileLoaded(true);
        }

        if (mounted.current) {
          setLoading(false);
        }
      } catch (error) {
        logger.error("[useAuth] Error during initialization:", error);
        if (mounted.current) {
          setUser(null);
          setIsAdmin(false);
          setProfileLoaded(true);
          setLoading(false);
        }
      }
    };

    // Écouter les changements d'état d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted.current) return;

      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user);
        setProfileLoaded(false);
        profileFetchAttempts.current = 0;
        await fetchProfileAndSetState(session.user);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsAdmin(false);
        setProfileLoaded(true);
        profileFetchAttempts.current = 0;
        // Nettoyer le localStorage
        localStorage.removeItem('sb-auth-token');
        localStorage.removeItem('coworkmy-auth-token');
      } else if (event === 'USER_UPDATED' && session?.user) {
        setUser(session.user);
        setProfileLoaded(false);
        await fetchProfileAndSetState(session.user);
      }
      
      if (mounted.current) {
        setLoading(false);
      }
    });

    // Initialiser l'état d'authentification
    initializeAuth();

    return () => {
      mounted.current = false;
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfileAndSetState = async (authUser: User) => {
    try {
      // Essayer d'abord avec user_id (relation avec auth.users)
      let { data: profile, error } = await supabase
        .from('profiles')
        .select('is_admin, id, user_id, email')
        .eq('user_id', authUser.id)
        .single();

      // Si pas trouvé avec user_id, essayer avec id
      if (error && error.code === 'PGRST116') {
        const { data: profileById, error: errorById } = await supabase
          .from('profiles')
          .select('is_admin, id, user_id, email')
          .eq('id', authUser.id)
          .single();
        
        if (!errorById) {
          profile = profileById;
          error = null;
        } else {
          error = errorById;
        }
      }

      // Si toujours pas trouvé, essayer avec email
      if (error && error.code === 'PGRST116') {
        const { data: profileByEmail, error: errorByEmail } = await supabase
          .from('profiles')
          .select('is_admin, id, user_id, email')
          .eq('email', authUser.email)
          .single();
        
        if (!errorByEmail) {
          profile = profileByEmail;
          error = null;
        } else {
          error = errorByEmail;
        }
      }

      if (error) {
        // L'erreur PGRST116 signifie "0 lignes retournées", ce qui peut arriver si le profil n'est pas encore créé
        if (error.code !== 'PGRST116') {
          throw error;
        }
      }
      
      const userIsAdmin = profile?.is_admin || false;
      
      // Vérifier si l'email est confirmé pour les admins
      if (userIsAdmin && !authUser.email_confirmed_at) {
        toast.warning("Votre email n'est pas confirmé. Certaines fonctionnalités admin peuvent être limitées.");
      }
      
      if (mounted.current) {
        setIsAdmin(userIsAdmin);
        setProfileLoaded(true);
        profileFetchAttempts.current = 0;
      }

    } catch (error) {
      logger.error("[useAuth] Error fetching profile:", error);
      
      // Gérer les erreurs spécifiques
      if (error && typeof error === 'object' && 'message' in error) {
        const errorMessage = (error as any).message;
        if (errorMessage.includes('JWT expired') || errorMessage.includes('Invalid JWT')) {
          toast.error('Session expirée, veuillez vous reconnecter');
          await signOut();
          return;
        }
      }
      
      // Retry logic pour les erreurs temporaires
      if (profileFetchAttempts.current < 3) {
        profileFetchAttempts.current++;
        logger.log(`[useAuth] Retry ${profileFetchAttempts.current}/3 - Profile fetch failed`);
        setTimeout(() => {
          if (mounted.current && user) {
            fetchProfileAndSetState(user);
          }
        }, 1000 * profileFetchAttempts.current);
        return;
      }
      
      if (mounted.current) {
        setIsAdmin(false); // Par sécurité, on ne donne pas les droits admin
        setProfileLoaded(true);
      }
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      if (mounted.current) {
        setUser(null);
        setIsAdmin(false);
        setProfileLoaded(true);
      }
      // Nettoyer le localStorage
      localStorage.removeItem('sb-auth-token');
      localStorage.removeItem('coworkmy-auth-token');
      navigate('/auth/login');
    } catch (error) {
      logger.error('Erreur lors de la déconnexion:', error);
      toast.error('Erreur lors de la déconnexion');
    }
  };

  return {
    user,
    loading: loading || !profileLoaded,
    isAdmin,
    signOut,
  };
};
