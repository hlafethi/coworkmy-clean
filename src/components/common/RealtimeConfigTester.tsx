import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, XCircle, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { toast } from 'sonner';

interface RealtimeConfigTesterProps {
  onConfigFixed?: () => void;
}

interface ConfigResult {
  success: boolean;
  message: string;
  publishedTables?: any[];
  missingTables?: string[];
  correctionsApplied?: boolean;
}

export const RealtimeConfigTester: React.FC<RealtimeConfigTesterProps> = ({ onConfigFixed }) => {
  const [isTesting, setIsTesting] = useState(false);
  const [configResult, setConfigResult] = useState<ConfigResult | null>(null);

  const testRealtimeConfig = async () => {
    setIsTesting(true);
    setConfigResult(null);

    try {
      const response = await fetch('/api/test-realtime-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result: ConfigResult = await response.json();

      if (result.success) {
        setConfigResult(result);
        toast.success('Configuration Realtime vérifiée !', {
          description: result.message,
        });
        
        if (result.correctionsApplied && onConfigFixed) {
          onConfigFixed();
        }
      } else {
        setConfigResult(result);
        toast.error('Erreur lors de la vérification', {
          description: result.message,
        });
      }
    } catch (error) {
      console.error('Erreur lors du test Realtime:', error);
      setConfigResult({
        success: false,
        message: 'Erreur de connexion au serveur',
      });
      toast.error('Erreur de connexion', {
        description: 'Impossible de contacter le serveur',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const getStatusIcon = () => {
    if (isTesting) return <Loader2 className="h-4 w-4 animate-spin" />;
    if (!configResult) return <AlertCircle className="h-4 w-4" />;
    if (configResult.success) return <CheckCircle className="h-4 w-4 text-green-500" />;
    return <XCircle className="h-4 w-4 text-red-500" />;
  };

  const getStatusText = () => {
    if (isTesting) return 'Vérification en cours...';
    if (!configResult) return 'Non testé';
    if (configResult.success) return 'Configuration OK';
    return 'Problème détecté';
  };

  const getStatusColor = () => {
    if (isTesting) return 'bg-yellow-100 text-yellow-800';
    if (!configResult) return 'bg-gray-100 text-gray-800';
    if (configResult.success) return 'bg-green-100 text-green-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wifi className="h-5 w-5" />
          Test Configuration Realtime
        </CardTitle>
        <CardDescription>
          Vérifie et corrige automatiquement la configuration des notifications temps réel
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Statut */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span className="font-medium">Statut:</span>
          </div>
          <Badge className={getStatusColor()}>
            {getStatusText()}
          </Badge>
        </div>

        {/* Bouton de test */}
        <Button 
          onClick={testRealtimeConfig} 
          disabled={isTesting}
          className="w-full"
        >
          {isTesting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Vérification en cours...
            </>
          ) : (
            <>
              <Wifi className="mr-2 h-4 w-4" />
              Tester et corriger la configuration
            </>
          )}
        </Button>

        {/* Résultats */}
        {configResult && (
          <div className="space-y-3">
            <div className="rounded-lg border p-3">
              <h4 className="font-medium mb-2">Résultat:</h4>
              <p className="text-sm text-gray-600">{configResult.message}</p>
            </div>

            {configResult.publishedTables && configResult.publishedTables.length > 0 && (
              <div className="rounded-lg border p-3">
                <h4 className="font-medium mb-2">Tables publiées:</h4>
                <div className="space-y-1">
                  {configResult.publishedTables.map((table: any, index: number) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      <code className="bg-gray-100 px-1 rounded">{table.tablename}</code>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {configResult.missingTables && configResult.missingTables.length > 0 && (
              <div className="rounded-lg border p-3">
                <h4 className="font-medium mb-2">Tables manquantes (corrigées):</h4>
                <div className="space-y-1">
                  {configResult.missingTables.map((table: string, index: number) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      <code className="bg-gray-100 px-1 rounded">{table}</code>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {configResult.correctionsApplied && (
              <div className="rounded-lg bg-green-50 border border-green-200 p-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800">
                    Corrections appliquées avec succès !
                  </span>
                </div>
                <p className="text-sm text-green-700 mt-1">
                  Les notifications temps réel devraient maintenant fonctionner correctement.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
          <h4 className="font-medium text-blue-800 mb-2">Instructions:</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Ce test vérifie que toutes les tables de support sont dans la publication Realtime</li>
            <li>• Si des tables manquent, elles sont automatiquement ajoutées</li>
            <li>• Après correction, rechargez la page pour tester les notifications</li>
            <li>• Si le problème persiste, contactez l'administrateur</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}; 