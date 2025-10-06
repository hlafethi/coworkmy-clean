import { useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { logger } from '@/utils/logger';

/**
 * Hook pour persister les données d'un formulaire dans localStorage
 * @param form - Instance du formulaire React Hook Form
 * @param key - Clé unique pour identifier le formulaire dans localStorage
 * @param enabled - Active ou désactive la persistance (défaut: true)
 */
export function usePersistedForm<T extends Record<string, any>>(
  form: UseFormReturn<T>,
  key: string,
  enabled: boolean = true
) {
  // Charger les données sauvegardées au montage
  useEffect(() => {
    if (!enabled) return;
    
    try {
      const savedData = localStorage.getItem(`form-${key}`);
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        logger.debug(`🔄 Restauration du formulaire ${key}:`, parsedData);
        form.reset(parsedData);
      }
    } catch (error) {
      logger.warn(`Erreur lors de la restauration du formulaire ${key}:`, error);
    }
  }, [form, key, enabled]);

  // Sauvegarder les données à chaque changement
  useEffect(() => {
    if (!enabled) return;

    const subscription = form.watch((data) => {
      try {
        localStorage.setItem(`form-${key}`, JSON.stringify(data));
        logger.debug(`💾 Sauvegarde automatique du formulaire ${key}`);
      } catch (error) {
        logger.warn(`Erreur lors de la sauvegarde du formulaire ${key}:`, error);
      }
    });

    return () => subscription.unsubscribe();
  }, [form, key, enabled]);

  // Nettoyer les données sauvegardées après soumission réussie
  const clearPersistedData = () => {
    if (!enabled) return;
    
    try {
      localStorage.removeItem(`form-${key}`);
      logger.debug(`🗑️ Nettoyage des données persistées pour ${key}`);
    } catch (error) {
      logger.warn(`Erreur lors du nettoyage du formulaire ${key}:`, error);
    }
  };

  return { clearPersistedData };
}
