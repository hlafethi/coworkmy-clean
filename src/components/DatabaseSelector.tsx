import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Database, Server, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { getCurrentDatabaseConfig, setCurrentDatabase, DATABASE_CONFIGS } from '@/config/database';
import { databaseClient } from '@/lib/database-client';

interface DatabaseStatus {
  isConnected: boolean;
  error?: string;
  tables?: string[];
}

export function DatabaseSelector() {
  const [currentDb, setCurrentDb] = useState(getCurrentDatabaseConfig());
  const [status, setStatus] = useState<DatabaseStatus>({ isConnected: false });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    testConnection();
  }, [currentDb]);

  const testConnection = async () => {
    setIsLoading(true);
    try {
      // Test simple de connexion
      const result = await databaseClient.query('SELECT 1 as test');
      
      if (result.error) {
        setStatus({
          isConnected: false,
          error: result.error
        });
      } else {
        setStatus({
          isConnected: true,
          tables: []
        });
      }
    } catch (error) {
      setStatus({
        isConnected: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDatabaseChange = (databaseId: string) => {
    setCurrentDatabase(databaseId);
    setCurrentDb(getCurrentDatabaseConfig());
  };

  const getDatabaseIcon = (type: string) => {
    switch (type) {
      case 'supabase':
        return <Database className="h-4 w-4" />;
      case 'mysql':
        return <Server className="h-4 w-4" />;
      case 'postgresql':
        return <Server className="h-4 w-4" />;
      default:
        return <Database className="h-4 w-4" />;
    }
  };

  const getDatabaseColor = (type: string) => {
    switch (type) {
      case 'supabase':
        return 'bg-green-100 text-green-800';
      case 'mysql':
        return 'bg-blue-100 text-blue-800';
      case 'postgresql':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Base de données
        </CardTitle>
        <CardDescription>
          Sélectionnez la base de données active pour l'application
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Sélecteur de base de données */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Base de données active</label>
          <Select value={currentDb.id} onValueChange={handleDatabaseChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DATABASE_CONFIGS.map((config) => (
                <SelectItem key={config.id} value={config.id}>
                  <div className="flex items-center gap-2">
                    {getDatabaseIcon(config.type)}
                    <span>{config.name}</span>
                    <Badge variant="secondary" className={getDatabaseColor(config.type)}>
                      {config.type}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Statut de connexion */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Statut de connexion</label>
          <div className="flex items-center gap-2">
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : status.isConnected ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-500" />
            )}
            <span className="text-sm">
              {isLoading ? 'Test en cours...' : 
               status.isConnected ? 'Connecté' : 'Non connecté'}
            </span>
          </div>
        </div>

        {/* Informations de configuration */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Configuration</label>
          <div className="text-xs space-y-1 text-muted-foreground">
            <div><strong>Type:</strong> {currentDb.type}</div>
            {currentDb.host && <div><strong>Hôte:</strong> {currentDb.host}</div>}
            {currentDb.port && <div><strong>Port:</strong> {currentDb.port}</div>}
            {currentDb.database && <div><strong>Base:</strong> {currentDb.database}</div>}
            {currentDb.username && <div><strong>Utilisateur:</strong> {currentDb.username}</div>}
          </div>
        </div>

        {/* Erreur de connexion */}
        {status.error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {status.error}
            </AlertDescription>
          </Alert>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={testConnection}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
            Tester
          </Button>
          
          {currentDb.type === 'mysql' && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                // Ouvrir la documentation MySQL
                window.open('/docs/mysql-setup', '_blank');
              }}
            >
              <Server className="h-4 w-4" />
              Configurer
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default DatabaseSelector;
