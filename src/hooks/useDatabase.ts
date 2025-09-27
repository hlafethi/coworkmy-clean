import { useState, useCallback } from 'react';
import { databaseClient } from '../lib/database-client';
import { getCurrentDatabaseConfig, setCurrentDatabaseConfig } from '../config/database';
import { useToast } from './use-toast';

export interface DatabaseConfig {
  type: 'supabase' | 'postgresql' | 'mysql';
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
  url?: string;
}

export interface DatabaseStatus {
  isConnected: boolean;
  error?: string;
  responseTime?: number;
}

export function useDatabase() {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<DatabaseStatus>({ isConnected: false });
  const { toast } = useToast();

  const testConnection = useCallback(async (config?: DatabaseConfig) => {
    setIsLoading(true);
    setStatus({ isConnected: false });

    try {
      const testConfig = config || getCurrentDatabaseConfig();
      const startTime = Date.now();

      // Test simple de connexion
      const result = await databaseClient.select('admin_settings', ['key'], { key: 'stripe' });
      const responseTime = Date.now() - startTime;

      if (result.error) {
        throw new Error(result.error);
      }

      setStatus({
        isConnected: true,
        responseTime
      });

      toast({
        title: "Connexion réussie",
        description: `Base ${testConfig.type} accessible en ${responseTime}ms`,
        variant: "default"
      });

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      setStatus({
        isConnected: false,
        error: errorMessage
      });

      toast({
        title: "Erreur de connexion",
        description: errorMessage,
        variant: "destructive"
      });

      return false;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const switchDatabase = useCallback(async (config: DatabaseConfig) => {
    setIsLoading(true);

    try {
      // Sauvegarder la nouvelle configuration
      setCurrentDatabaseConfig(config);

      // Tester la connexion
      const isConnected = await testConnection(config);

      if (isConnected) {
        toast({
          title: "Base de données changée",
          description: `Passage à ${config.type} réussi`,
          variant: "default"
        });

        // Recharger l'application pour appliquer les changements
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }

      return isConnected;
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de changer de base de données",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [testConnection, toast]);

  const migrateData = useCallback(async (sourceConfig: DatabaseConfig, targetConfig: DatabaseConfig) => {
    setIsLoading(true);

    try {
      // Sauvegarder la configuration actuelle
      const currentConfig = getCurrentDatabaseConfig();

      // Basculer vers la source
      setCurrentDatabaseConfig(sourceConfig);
      await new Promise(resolve => setTimeout(resolve, 100));

      // Récupérer les données de la source
      const tables = ['profiles', 'spaces', 'admin_settings', 'time_slots', 'bookings', 'payments', 'support_messages', 'support_chat_sessions'];
      const allData: Record<string, any[]> = {};

      for (const table of tables) {
        const result = await databaseClient.select(table);
        if (!result.error && result.data) {
          allData[table] = result.data;
        }
      }

      // Basculer vers la cible
      setCurrentDatabaseConfig(targetConfig);
      await new Promise(resolve => setTimeout(resolve, 100));

      // Insérer les données dans la cible
      let migratedCount = 0;
      for (const [table, data] of Object.entries(allData)) {
        for (const row of data) {
          const result = await databaseClient.insert(table, row);
          if (!result.error) {
            migratedCount++;
          }
        }
      }

      // Restaurer la configuration originale
      setCurrentDatabaseConfig(currentConfig);

      toast({
        title: "Migration terminée",
        description: `${migratedCount} enregistrements migrés de ${sourceConfig.type} vers ${targetConfig.type}`,
        variant: "default"
      });

      return true;
    } catch (error) {
      toast({
        title: "Erreur de migration",
        description: error instanceof Error ? error.message : "Erreur inconnue",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const getDatabaseInfo = useCallback(() => {
    const config = getCurrentDatabaseConfig();
    return {
      type: config.type,
      host: config.host || 'N/A',
      database: config.database || 'N/A',
      url: config.url || 'N/A'
    };
  }, []);

  return {
    isLoading,
    status,
    testConnection,
    switchDatabase,
    migrateData,
    getDatabaseInfo
  };
} 