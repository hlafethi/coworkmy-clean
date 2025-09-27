import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface ChannelConfig {
  channel: RealtimeChannel;
  callback: (payload: any) => void;
  table: string;
  event?: string;
}

const channels = new Map<string, ChannelConfig>();
let _isInitialized = false;

// Délai entre les tentatives de reconnexion (en ms)
const RETRY_DELAYS = [1000, 2000, 5000];

export function createChannel(
  channelName: string,
  table: string,
  callback: (payload: any) => void,
  event: string = '*'
): void {
  if (channels.has(channelName)) {
    console.log(`⚠️ Canal ${channelName} existe déjà. Il ne sera pas recréé.`);
    return;
  }

  try {
    const channel = supabase.channel(channelName);

    // Stocker immédiatement pour éviter les recréations multiples
    channels.set(channelName, { channel, callback, table, event });

    channel
      .on(
        'postgres_changes',
        { event: event as any, schema: 'public', table: table },
        (payload) => {
          console.log(`📡 Événement reçu sur ${channelName}:`, payload);
          callback(payload);
        }
      )
      .subscribe((status, err) => {
        if (err) {
          console.error(`❌ Erreur de souscription au canal ${channelName}:`, err.message);
          
          if (err.message.includes('mismatch')) {
            console.error(
              `💡 ASTUCE: L'erreur "mismatch between server and client bindings" indique un problème de configuration sur Supabase. ` +
              `Veuillez vérifier que "Realtime" est activé pour la table "${table}" dans votre projet Supabase (Database > Replication).`
            );
          }
          
          // Supprimer le canal en cas d'erreur pour permettre une nouvelle tentative
          channels.delete(channelName);
          return;
        }

        if (status === 'SUBSCRIBED') {
          console.log(`✅ Canal ${channelName} souscrit avec succès.`);
          _isInitialized = true;
        } else {
          console.log(`📡 Statut WebSocket ${channelName}: ${status}`);
        }
      });
  } catch (error) {
    console.error(`❌ Erreur non interceptée lors de la création du canal ${channelName}:`, error);
  }
}

export function removeChannel(channelName: string): void {
  const channelConfig = channels.get(channelName);
  if (channelConfig) {
    console.log(`🔌 Suppression du canal WebSocket: ${channelName}`);
    channelConfig.channel.unsubscribe()
      .then(() => {
        supabase.removeChannel(channelConfig.channel);
        channels.delete(channelName);
        console.log(`✅ Canal ${channelName} supprimé avec succès`);
      });
  } else {
    console.log(`ℹ️ Canal ${channelName} non trouvé pour suppression.`);
  }
}

export function removeAllChannels(): void {
  console.log("🧹 Suppression de tous les canaux WebSocket...");
  supabase.removeAllChannels();
  channels.clear();
  _isInitialized = false;
  console.log("✅ Tous les canaux WebSocket supprimés");
}

export function getChannelStatus(channelName: string): string {
  const channelConfig = channels.get(channelName);
  return channelConfig ? channelConfig.channel.state : 'NOT_FOUND';
}

export function getAllChannels(): string[] {
  return Array.from(channels.keys());
}

export function isInitialized(): boolean {
  return _isInitialized;
}
