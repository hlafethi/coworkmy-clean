import { useState, useEffect } from 'react';
import { logger } from '@/utils/logger';

/**
 * Hook personnalisé pour persister l'état des onglets dans localStorage
 * @param key - Clé unique pour identifier l'onglet dans localStorage
 * @param defaultValue - Valeur par défaut si aucune valeur n'est trouvée
 * @returns [activeTab, setActiveTab] - État et setter pour l'onglet actif
 */
export function usePersistedTab(key: string, defaultValue: string) {
  const [activeTab, setActiveTab] = useState<string>(() => {
    try {
      const item = localStorage.getItem(`tab-${key}`);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      logger.warn(`Erreur lors de la lecture de l'onglet ${key}:`, error);
      return defaultValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(`tab-${key}`, JSON.stringify(activeTab));
    } catch (error) {
      logger.warn(`Erreur lors de la sauvegarde de l'onglet ${key}:`, error);
    }
  }, [activeTab, key]);

  return [activeTab, setActiveTab] as const;
}
