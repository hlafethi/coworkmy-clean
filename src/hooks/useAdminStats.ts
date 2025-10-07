import { useState, useEffect, useCallback, useRef } from "react";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
// Logger supprimé - utilisation de console directement
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
  recent_bookings: []
};

export const useAdminStats = (mode: 'test' | 'live' = 'test') => {
  const [state, setState] = useState<AdminStatsState>({
    data: null,
    loading: true,
    error: null,
    lastUpdated: null
  });

  const retryCountRef = useRef(0);
  const maxRetries = 3;

  const updateState = useCallback((updates: Partial<AdminStatsState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      if (retryCountRef.current > 0) {
        updateState({ loading: true, error: null });
      }

      console.log(`📊 Chargement des statistiques admin (mode: ${mode})...`);
      
      const response = await apiClient.get(`/admin/stats?mode=${mode}`);
      
      if (!response.success) {
        throw new Error(response.error || 'Erreur lors du chargement des statistiques');
      }

      updateState({
        data: response.data,
        loading: false,
        error: null,
        lastUpdated: new Date()
      });

      retryCountRef.current = 0; // Reset du compteur en cas de succès

    } catch (error) {
      console.error('❌ Erreur lors du chargement des statistiques:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      
      if (retryCountRef.current < maxRetries) {
        retryCountRef.current++;
        console.log(`🔄 Tentative de reconnexion ${retryCountRef.current}/${maxRetries}...`);
        
        // Retry avec délai exponentiel
        setTimeout(() => {
          fetchStats();
        }, Math.pow(2, retryCountRef.current) * 1000);
      } else {
        updateState({
          error: errorMessage,
          loading: false,
          data: DEFAULT_STATS
        });
        retryCountRef.current = 0;
      }
    }
  }, [updateState, mode]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const refreshStats = useCallback(() => {
    retryCountRef.current = 0;
    fetchStats();
  }, [fetchStats]);

  return {
    ...state,
    refreshStats
  };
};