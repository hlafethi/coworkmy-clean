import { logger } from '@/utils/logger';
// WebSocket Manager pour PostgreSQL (version simplifiée)
// Note: Les WebSockets en temps réel ne sont pas disponibles avec PostgreSQL direct

interface ChannelConfig {
  channel: any; // Pas de WebSocket en temps réel avec PostgreSQL direct
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
    logger.debug(`⚠️ Canal ${channelName} existe déjà. Il ne sera pas recréé.`);
    return;
  }

  try {
    // Pour PostgreSQL direct, les WebSockets en temps réel ne sont pas disponibles
    logger.debug(`ℹ️ WebSocket temps réel non disponible avec PostgreSQL direct (${channelName})`);
    
    // TODO: Implémenter une vraie connexion WebSocket
    const mockChannel = {
      unsubscribe: () => {},
      on: () => mockChannel,
      subscribe: () => ({ status: 'SUBSCRIBED' })
    };
    
    channels.set(channelName, { 
      channel: mockChannel, 
      callback, 
      table, 
      event 
    });
    
    logger.debug(`✅ Canal ${channelName} configuré (PostgreSQL mode)`);
    _isInitialized = true;

  } catch (error) {
    logger.error(`❌ Erreur non interceptée lors de la création du canal ${channelName}:`, error);
  }
}

export function removeChannel(channelName: string): void {
  const channelConfig = channels.get(channelName);
  
  if (channelConfig) {
    try {
      // Déconnexion du canal
      logger.debug(`🔌 Déconnexion du canal ${channelName} (PostgreSQL mode)`);
      channels.delete(channelName);
    } catch (error) {
      logger.error(`❌ Erreur lors de la suppression du canal ${channelName}:`, error);
    }
  } else {
    logger.debug(`⚠️ Canal ${channelName} non trouvé pour suppression`);
  }
}

export function getAllChannels(): string[] {
  return Array.from(channels.keys());
}

export function isInitialized(): boolean {
  return _isInitialized;
}

export function cleanupAllChannels(): void {
  logger.debug('🧹 Nettoyage des canaux WebSocket admin');
  
  for (const [channelName] of channels) {
    removeChannel(channelName);
  }
  
  _isInitialized = false;
}