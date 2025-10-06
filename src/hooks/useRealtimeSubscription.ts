import { useEffect, useRef, useCallback } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { logger } from '@/utils/logger';

interface UseRealtimeSubscriptionOptions {
  channelName: string;
  table: string;
  event: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  onMessage: (payload: any) => void;
  onError?: (error: any) => void;
  onStatusChange?: (status: string) => void;
  retryAttempts?: number;
  retryDelay?: number;
}

export const useRealtimeSubscription = ({
  channelName,
  table,
  event,
  onMessage,
  onError,
  onStatusChange,
  retryAttempts = 3,
  retryDelay = 2000
}: UseRealtimeSubscriptionOptions) => {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const isSubscribedRef = useRef(false);
  const retryCountRef = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const cleanup = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    if (channelRef.current) {
      try {
        supabase.removeChannel(channelRef.current);
      } catch (error) {
        logger.debug(`[useRealtimeSubscription] Erreur lors du nettoyage du canal ${channelName}:`, error);
      }
      channelRef.current = null;
    }
    
    isSubscribedRef.current = false;
  }, [channelName]);

  const setupSubscription = useCallback(() => {
    if (isSubscribedRef.current) {
      logger.debug(`[useRealtimeSubscription] Canal ${channelName} déjà actif, skip...`);
      return;
    }

    // Nettoyer l'abonnement existant
    cleanup();

    try {
      logger.debug(`[useRealtimeSubscription] Création du canal ${channelName}...`);
      
      // Vérifier que Supabase est configuré
      if (!isSupabaseConfigured() || !supabase) {
        logger.debug(`[useRealtimeSubscription] Supabase non configuré - souscription temps réel désactivée pour ${channelName}`);
        if (onStatusChange) {
          onStatusChange('disconnected');
        }
        return;
      }

      // Créer le canal avec une configuration plus robuste
      channelRef.current = supabase.channel(channelName, {
        config: {
          presence: {
            key: channelName,
          },
        },
      })
        .on('postgres_changes', { 
          event, 
          schema: 'public', 
          table 
        }, (payload) => {
          logger.debug(`[useRealtimeSubscription] Message reçu sur ${channelName}:`, payload);
          onMessage(payload);
        })
        .on('presence', { event: 'sync' }, () => {
          logger.debug(`[useRealtimeSubscription] Presence sync pour ${channelName}`);
        })
        .on('presence', { event: 'join' }, ({ key, newPresences }) => {
          logger.debug(`[useRealtimeSubscription] Presence join pour ${channelName}:`, key, newPresences);
        })
        .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
          logger.debug(`[useRealtimeSubscription] Presence leave pour ${channelName}:`, key, leftPresences);
        })
        .subscribe((status) => {
          logger.debug(`[useRealtimeSubscription] Statut canal ${channelName}:`, status);
          
          if (onStatusChange) {
            onStatusChange(status);
          }
          
          if (status === 'SUBSCRIBED') {
            logger.debug(`[useRealtimeSubscription] ✅ Canal ${channelName} actif`);
            isSubscribedRef.current = true;
            retryCountRef.current = 0;
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            logger.error(`[useRealtimeSubscription] ❌ Erreur canal ${channelName}:`, status);
            isSubscribedRef.current = false;
            
            if (retryCountRef.current < retryAttempts) {
              retryCountRef.current++;
              logger.debug(`[useRealtimeSubscription] Tentative de reconnexion ${retryCountRef.current}/${retryAttempts} pour ${channelName}...`);
              
              timeoutRef.current = setTimeout(() => {
                setupSubscription();
              }, retryDelay * retryCountRef.current);
            } else {
              logger.error(`[useRealtimeSubscription] Nombre maximum de tentatives atteint pour ${channelName}`);
              if (onError) {
                onError(new Error(`Impossible de se connecter au canal ${channelName}`));
              }
            }
          } else if (status === 'CLOSED') {
            logger.debug(`[useRealtimeSubscription] Canal ${channelName} fermé`);
            isSubscribedRef.current = false;
          }
        });
        
    } catch (error) {
      logger.error(`[useRealtimeSubscription] Erreur lors de la configuration du canal ${channelName}:`, error);
      if (onError) {
        onError(error);
      }
      isSubscribedRef.current = false;
    }
  }, [channelName, table, event, onMessage, onError, onStatusChange, retryAttempts, retryDelay, cleanup]);

  useEffect(() => {
    logger.debug(`[useRealtimeSubscription] Initialisation du canal ${channelName}...`);
    
    // Démarrer l'abonnement avec un délai pour éviter les conflits
    timeoutRef.current = setTimeout(() => {
      setupSubscription();
    }, 1000);

    return () => {
      logger.debug(`[useRealtimeSubscription] Nettoyage du canal ${channelName}...`);
      cleanup();
    };
  }, [channelName, setupSubscription, cleanup]);

  return {
    isSubscribed: isSubscribedRef.current,
    channel: channelRef.current,
    retryCount: retryCountRef.current
  };
}; 