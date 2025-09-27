import { useEffect, useRef, useCallback } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

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
        console.log(`[useRealtimeSubscription] Erreur lors du nettoyage du canal ${channelName}:`, error);
      }
      channelRef.current = null;
    }
    
    isSubscribedRef.current = false;
  }, [channelName]);

  const setupSubscription = useCallback(() => {
    if (isSubscribedRef.current) {
      console.log(`[useRealtimeSubscription] Canal ${channelName} déjà actif, skip...`);
      return;
    }

    // Nettoyer l'abonnement existant
    cleanup();

    try {
      console.log(`[useRealtimeSubscription] Création du canal ${channelName}...`);
      
      // Vérifier que le client Supabase est initialisé
      if (!supabase) {
        console.error(`[useRealtimeSubscription] Client Supabase non initialisé pour ${channelName}`);
        if (onError) {
          onError(new Error('Client Supabase non initialisé'));
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
          console.log(`[useRealtimeSubscription] Message reçu sur ${channelName}:`, payload);
          onMessage(payload);
        })
        .on('presence', { event: 'sync' }, () => {
          console.log(`[useRealtimeSubscription] Presence sync pour ${channelName}`);
        })
        .on('presence', { event: 'join' }, ({ key, newPresences }) => {
          console.log(`[useRealtimeSubscription] Presence join pour ${channelName}:`, key, newPresences);
        })
        .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
          console.log(`[useRealtimeSubscription] Presence leave pour ${channelName}:`, key, leftPresences);
        })
        .subscribe((status) => {
          console.log(`[useRealtimeSubscription] Statut canal ${channelName}:`, status);
          
          if (onStatusChange) {
            onStatusChange(status);
          }
          
          if (status === 'SUBSCRIBED') {
            console.log(`[useRealtimeSubscription] ✅ Canal ${channelName} actif`);
            isSubscribedRef.current = true;
            retryCountRef.current = 0;
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.error(`[useRealtimeSubscription] ❌ Erreur canal ${channelName}:`, status);
            isSubscribedRef.current = false;
            
            if (retryCountRef.current < retryAttempts) {
              retryCountRef.current++;
              console.log(`[useRealtimeSubscription] Tentative de reconnexion ${retryCountRef.current}/${retryAttempts} pour ${channelName}...`);
              
              timeoutRef.current = setTimeout(() => {
                setupSubscription();
              }, retryDelay * retryCountRef.current);
            } else {
              console.error(`[useRealtimeSubscription] Nombre maximum de tentatives atteint pour ${channelName}`);
              if (onError) {
                onError(new Error(`Impossible de se connecter au canal ${channelName}`));
              }
            }
          } else if (status === 'CLOSED') {
            console.log(`[useRealtimeSubscription] Canal ${channelName} fermé`);
            isSubscribedRef.current = false;
          }
        });
        
    } catch (error) {
      console.error(`[useRealtimeSubscription] Erreur lors de la configuration du canal ${channelName}:`, error);
      if (onError) {
        onError(error);
      }
      isSubscribedRef.current = false;
    }
  }, [channelName, table, event, onMessage, onError, onStatusChange, retryAttempts, retryDelay, cleanup]);

  useEffect(() => {
    console.log(`[useRealtimeSubscription] Initialisation du canal ${channelName}...`);
    
    // Démarrer l'abonnement avec un délai pour éviter les conflits
    timeoutRef.current = setTimeout(() => {
      setupSubscription();
    }, 1000);

    return () => {
      console.log(`[useRealtimeSubscription] Nettoyage du canal ${channelName}...`);
      cleanup();
    };
  }, [channelName, setupSubscription, cleanup]);

  return {
    isSubscribed: isSubscribedRef.current,
    channel: channelRef.current,
    retryCount: retryCountRef.current
  };
}; 