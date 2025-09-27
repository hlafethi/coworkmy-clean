import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { createChannel, removeChannel, getAllChannels } from "@/lib";
import { toast } from "sonner";
import { logger } from "@/utils/logger";

export interface AdminStats {
  total_users: number;
  active_users: number;
  total_spaces: number;
  available_spaces: number;
  total_bookings: number;
  active_bookings: number;
  total_revenue: number;
  monthly_revenue: number;
  popular_spaces: Array<{
    id: string;
    name: string;
    bookings_count: number;
  }>;
  recent_bookings: any[];
}

export interface AdminStatsState {
  data: AdminStats | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

const DEFAULT_STATS: AdminStats = {
  total_users: 0,
  active_users: 0,
  total_spaces: 0,
  available_spaces: 0,
  total_bookings: 0,
  active_bookings: 0,
  total_revenue: 0,
  monthly_revenue: 0,
  popular_spaces: [],
  recent_bookings: [],
};

// Debounce function
const debounce = (func: Function, wait: number) => {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: any[]) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export const useAdminStats = () => {
  const [state, setState] = useState<AdminStatsState>({
    data: null,
    loading: true,
    error: null,
    lastUpdated: null
  });
  
  const isMountedRef = useRef(true);
  const retryCountRef = useRef(0);
  const lastUpdateRef = useRef<number>(0);
  const isInitializedRef = useRef(false);
  const MAX_RETRIES = 3;
  const MIN_UPDATE_INTERVAL = 5000; // 5 secondes minimum entre les mises à jour

  const updateState = useCallback((updates: Partial<AdminStatsState>) => {
    if (isMountedRef.current) {
      setState(prev => ({ ...prev, ...updates }));
    }
  }, []);

  const fetchStats = useCallback(async (isRetry = false) => {
    if (!isMountedRef.current) return;

    const now = Date.now();
    if (now - lastUpdateRef.current < MIN_UPDATE_INTERVAL && !isRetry) {
      logger.log('⏳ Mise à jour ignorée - trop récente');
      return;
    }

    try {
      if (!isRetry) {
        updateState({ loading: true, error: null });
      }

      logger.log('📊 Chargement des statistiques admin...');

      // Vérifier d'abord l'authentification
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        logger.error('❌ Erreur d\'authentification:', authError.message);
        if (authError.message.includes('JWT expired') || authError.message.includes('Invalid JWT')) {
          updateState({ 
            error: 'Session expirée, veuillez vous reconnecter', 
            loading: false,
            data: DEFAULT_STATS
          });
          return; // Ne pas retenter en cas d'erreur d'authentification
        }
        throw authError;
      }

      if (!user) {
        logger.warn('⚠️ Aucun utilisateur connecté');
        updateState({ 
          error: 'Utilisateur non connecté', 
          loading: false,
          data: DEFAULT_STATS
        });
        return;
      }

      // Récupérer les statistiques des utilisateurs
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('id, user_id')
        .not('user_id', 'is', null);

      if (usersError) {
        logger.warn('⚠️ Erreur profiles:', usersError.message);
        // Si c'est une erreur de permission, ne pas retenter
        if (usersError.message.includes('permission denied') || usersError.message.includes('403')) {
          updateState({ 
            error: 'Permissions insuffisantes pour accéder aux statistiques', 
            loading: false,
            data: DEFAULT_STATS
          });
          return;
        }
      }

      // Récupérer les statistiques des espaces
      const { data: spacesData, error: spacesError } = await supabase
        .from('spaces')
        .select('id, name, is_active')
        .eq('is_active', true);

      if (spacesError) {
        logger.warn('⚠️ Erreur spaces:', spacesError.message);
        if (spacesError.message.includes('permission denied') || spacesError.message.includes('403')) {
          updateState({ 
            error: 'Permissions insuffisantes pour accéder aux espaces', 
            loading: false,
            data: DEFAULT_STATS
          });
          return;
        }
      }

      // Récupérer les statistiques des réservations
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select(`id, status, total_price_ttc, space_id, created_at, user_id,
          spaces (name),
          profiles: user_id (first_name, last_name, email, company)
        `)
        .order('created_at', { ascending: false });

      if (bookingsError) {
        logger.warn('⚠️ Erreur bookings:', bookingsError.message);
        if (bookingsError.message.includes('permission denied') || bookingsError.message.includes('403')) {
          updateState({ 
            error: 'Permissions insuffisantes pour accéder aux réservations', 
            loading: false,
            data: DEFAULT_STATS
          });
          return;
        }
      }

      // Calculer les statistiques
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const totalRevenue = bookingsData?.reduce((sum, booking) => {
        return sum + (parseFloat(booking.total_price_ttc?.toString() || '0') || 0);
      }, 0) || 0;

      const monthlyRevenue = bookingsData
        ?.filter(booking => new Date(booking.created_at) >= firstDayOfMonth)
        ?.reduce((sum, booking) => {
          return sum + (parseFloat(booking.total_price_ttc?.toString() || '0') || 0);
        }, 0) || 0;

      const bookingsBySpace = bookingsData?.reduce((acc, booking) => {
        const spaceId = booking.space_id;
        if (spaceId) {
          acc[spaceId] = (acc[spaceId] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>) || {};

      const recent_bookings = (bookingsData || []).slice(0, 5).map((booking: any) => ({
        id: booking.id,
        space_name: booking.spaces?.name || 'Espace inconnu',
        user_name: booking.profiles?.first_name || booking.profiles?.last_name
          ? `${booking.profiles?.first_name || ''} ${booking.profiles?.last_name || ''}`.trim()
          : booking.profiles?.email || 'Utilisateur inconnu',
        company: booking.profiles?.company || '',
        created_at: booking.created_at ? new Date(booking.created_at).toLocaleString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '',
        status: booking.status
      }));

      const stats: AdminStats = {
        total_users: usersData?.length || 0,
        active_users: usersData?.length || 0,
        total_spaces: spacesData?.length || 0,
        available_spaces: spacesData?.length || 0,
        total_bookings: bookingsData?.length || 0,
        active_bookings: bookingsData?.filter(booking => 
          booking.status === 'confirmed' || booking.status === 'active' || booking.status === 'approved'
        )?.length || 0,
        total_revenue: totalRevenue,
        monthly_revenue: monthlyRevenue,
        popular_spaces: spacesData?.slice(0, 5).map(space => ({
          id: space.id,
          name: space.name,
          bookings_count: bookingsBySpace[space.id] || 0
        })) || [],
        recent_bookings
      };

      if (isMountedRef.current) {
        lastUpdateRef.current = Date.now();
        updateState({
          data: stats,
          loading: false,
          error: null,
          lastUpdated: new Date()
        });
        retryCountRef.current = 0;
        logger.log('✅ Statistiques chargées:', stats);
      }
    } catch (error) {
      logger.error('❌ Erreur lors du chargement des statistiques:', error);
      
      if (isMountedRef.current) {
        const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue';
        
        // Ne pas retenter pour les erreurs d'authentification ou de permission
        const shouldRetry = !errorMessage.includes('JWT expired') && 
                           !errorMessage.includes('Invalid JWT') && 
                           !errorMessage.includes('permission denied') &&
                           !errorMessage.includes('403');
        
        updateState({ 
          error: errorMessage, 
          loading: false,
          data: DEFAULT_STATS
        });

        if (shouldRetry && retryCountRef.current < MAX_RETRIES) {
          retryCountRef.current++;
          logger.log(`🔄 Tentative de reconnexion ${retryCountRef.current}/${MAX_RETRIES}...`);
          setTimeout(() => fetchStats(true), 2000 * retryCountRef.current);
        } else if (!shouldRetry) {
          logger.log('🚫 Pas de nouvelle tentative pour cette erreur');
        } else {
          toast.error('Impossible de charger les statistiques après plusieurs tentatives');
        }
      }
    }
  }, [updateState]);

  // Debounced version of fetchStats
  const debouncedFetchStats = useCallback(
    debounce((isRetry = false) => fetchStats(isRetry), 1000),
    [fetchStats]
  );

  const channelsRef = useRef<string[]>([]);

  useEffect(() => {
    // Éviter l'initialisation multiple
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    fetchStats();

    // Créer les canaux WebSocket avec gestion d'erreur
    const createWebSocketChannels = () => {
      try {
        // Nettoyer les canaux existants avant d'en créer de nouveaux
        channelsRef.current.forEach(channelName => {
          removeChannel(channelName);
        });
        channelsRef.current = [];

        // Créer les nouveaux canaux avec un délai entre chaque création
        const createChannelWithDelay = (channelName: string, table: string, index: number) => {
          setTimeout(() => {
            createChannel(channelName, table, (_) => {
              debouncedFetchStats();
            });
            channelsRef.current.push(channelName);
          }, index * 1000); // 1 seconde de délai entre chaque création
        };

        createChannelWithDelay('admin_stats_bookings', 'bookings', 0);
        createChannelWithDelay('admin_stats_spaces', 'spaces', 1);
        createChannelWithDelay('admin_stats_profiles', 'profiles', 2);
        
        logger.log('✅ Canaux WebSocket créés pour les statistiques admin');
      } catch (error) {
        logger.error('❌ Erreur lors de la création des canaux WebSocket:', error);
      }
    };

    // Délai initial avant de créer les canaux
    setTimeout(createWebSocketChannels, 2000);

    return () => {
      logger.log('🧹 Nettoyage des canaux WebSocket admin');
      channelsRef.current.forEach(channelName => {
        removeChannel(channelName);
      });
      channelsRef.current = [];
    };
  }, [fetchStats, debouncedFetchStats]);

  return {
    stats: state.data || DEFAULT_STATS,
    loading: state.loading,
    error: state.error,
    lastUpdated: state.lastUpdated,
    refetch: () => fetchStats(),
    activeConnections: getAllChannels(),
    connectionCount: getAllChannels().length
  };
};
