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
    console.log(`⚠️ Canal ${channelName} existe déjà. Il ne sera pas recréé.`);
    return;
  }

  try {
    // Pour PostgreSQL direct, les WebSockets en temps réel ne sont pas disponibles
    console.log(`ℹ️ WebSocket temps réel non disponible avec PostgreSQL direct (${channelName})`);
    
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
    
    console.log(`✅ Canal ${channelName} configuré (PostgreSQL mode)`);
    _isInitialized = true;

  } catch (error) {
    console.error(`❌ Erreur non interceptée lors de la création du canal ${channelName}:`, error);
  }
}

export function removeChannel(channelName: string): void {
  const channelConfig = channels.get(channelName);
  
  if (channelConfig) {
    try {
      // Déconnexion du canal
      console.log(`🔌 Déconnexion du canal ${channelName} (PostgreSQL mode)`);
      channels.delete(channelName);
    } catch (error) {
      console.error(`❌ Erreur lors de la suppression du canal ${channelName}:`, error);
    }
  } else {
    console.log(`⚠️ Canal ${channelName} non trouvé pour suppression`);
  }
}

export function getAllChannels(): string[] {
  return Array.from(channels.keys());
}

export function isInitialized(): boolean {
  return _isInitialized;
}

export function cleanupAllChannels(): void {
  console.log('🧹 Nettoyage des canaux WebSocket admin');
  
  for (const [channelName] of channels) {
    removeChannel(channelName);
  }
  
  _isInitialized = false;
}