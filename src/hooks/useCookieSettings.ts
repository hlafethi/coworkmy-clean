import { useState, useEffect, useCallback, useRef } from 'react';
import { apiClient } from '@/lib/api-client';
import { AdminCookieSettings } from '@/types/cookies';
// Logger supprimé - utilisation de console directement
export function useCookieSettings() {
  const [settings, setSettings] = useState<AdminCookieSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const hasLoadedFromCache = useRef(false);
  const hasLoadedFromAPI = useRef(false);

  const loadSettings = useCallback(async (forceRefresh = false) => {
    try {
      // Ne pas recharger si on a déjà des données et qu'on ne force pas le refresh
      if (!forceRefresh && settings && !loading) {
        return;
      }

      setLoading(true);
      
      const response = await apiClient.get('/cookie-settings');
      if (response.success) {
        
        // Toujours mettre à jour les paramètres si forceRefresh ou si les données ont changé
        const newData = JSON.stringify(response.data);
        const currentData = settings ? JSON.stringify(settings) : null;
        
        if (forceRefresh || newData !== currentData) {
          setSettings(response.data);
          // Mettre en cache dans localStorage pour un accès rapide
          localStorage.setItem('cookie-settings-cache', newData);
        } else {
        }
        hasLoadedFromAPI.current = true;
      } else {
        throw new Error(response.error || 'Erreur lors du chargement');
      }
    } catch (err) {
      console.error('❌ Erreur lors du chargement des paramètres cookies:', err);
      setError(err instanceof Error ? err : new Error('Failed to load cookie settings'));
      
      // En cas d'erreur, essayer de charger depuis le cache seulement si pas encore fait
      if (!hasLoadedFromCache.current) {
        try {
          const cached = localStorage.getItem('cookie-settings-cache');
          if (cached) {
            const cachedSettings = JSON.parse(cached);
            setSettings(cachedSettings);
            console.log('📦 Utilisation du cache pour les paramètres cookies');
            hasLoadedFromCache.current = true;
          }
        } catch (cacheErr) {
          console.error('❌ Erreur lors du chargement du cache:', cacheErr);
        }
      }
    } finally {
      setLoading(false);
    }
  }, []); // Suppression des dépendances qui causaient la boucle

  useEffect(() => {
    // Charger depuis le cache d'abord pour un affichage rapide (une seule fois)
    if (!hasLoadedFromCache.current) {
      try {
        const cached = localStorage.getItem('cookie-settings-cache');
        if (cached) {
          const cachedSettings = JSON.parse(cached);
          setSettings(cachedSettings);
          hasLoadedFromCache.current = true;
        }
      } catch (err) {
      }
    }
    
    // Puis charger depuis l'API pour avoir les données à jour (une seule fois)
    if (!hasLoadedFromAPI.current) {
      loadSettings();
    }
  }, []); // Exécution unique au montage

  // Écouter les changements de paramètres cookies
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'cookie-settings-cache' && e.newValue) {
        try {
          const newSettings = JSON.parse(e.newValue);
          setSettings(newSettings);
        } catch (err) {
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return {
    settings,
    loading,
    error,
    refetch: loadSettings
  };
}
