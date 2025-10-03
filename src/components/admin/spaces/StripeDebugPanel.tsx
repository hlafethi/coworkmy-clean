import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, AlertCircle, RefreshCw, Zap } from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface StripeDebugPanelProps {
  className?: string;
}

interface DebugResult {
  success: boolean;
  message: string;
  details?: any;
  timestamp: string;
}

export default function StripeDebugPanel({ className }: StripeDebugPanelProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<DebugResult[]>([]);
  const [stripeConnection, setStripeConnection] = useState<any>(null);
  const [selectedMode, setSelectedMode] = useState<'test' | 'live'>('test');

  const addResult = (result: DebugResult) => {
    setResults(prev => [result, ...prev.slice(0, 9)]); // Garder les 10 derniers résultats
  };

  const testStripeConnection = async () => {
    setIsLoading(true);
    try {
      // Test de connexion Stripe réelle
      const response = await apiClient.get('/stripe/test-connection');
      
      if (response.success) {
        setStripeConnection({ 
          success: true, 
          message: response.data.message,
          connected: response.data.connected,
          products_count: response.data.products_count
        });
        addResult({
          success: true,
          message: `Connexion Stripe: ${response.data.message}`,
          details: {
            connected: response.data.connected,
            products_count: response.data.products_count,
            message: response.data.message
          },
          timestamp: new Date().toLocaleString('fr-FR')
        });
      } else {
        addResult({
          success: false,
          message: `Erreur Stripe: ${response.error || 'Inconnue'}`,
          details: response,
          timestamp: new Date().toLocaleString('fr-FR')
        });
      }
    } catch (error) {
      addResult({
        success: false,
        message: `Erreur: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: new Date().toLocaleString('fr-FR')
      });
    } finally {
      setIsLoading(false);
    }
  };

  const syncAllSpaces = async () => {
    setIsLoading(true);
    try {
      // Synchronisation réelle avec Stripe
      const response = await apiClient.post('/stripe/sync-all', {
        mode: selectedMode
      });
      
      if (response.success) {
        addResult({
          success: true,
          message: `Synchronisation Stripe: ${response.data.success_count}/${response.data.total_spaces} espaces synchronisés`,
          details: {
            total_spaces: response.data.total_spaces,
            success_count: response.data.success_count,
            error_count: response.data.error_count,
            skipped_count: response.data.skipped_count,
            results: (response.data.results || []).slice(0, 5) // Afficher les 5 premiers résultats
          },
          timestamp: new Date().toLocaleString('fr-FR')
        });
      } else {
        addResult({
          success: false,
          message: `Erreur synchronisation: ${response.error || 'Inconnue'}`,
          details: response,
          timestamp: new Date().toLocaleString('fr-FR')
        });
      }
    } catch (error) {
      addResult({
        success: false,
        message: `Erreur: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: new Date().toLocaleString('fr-FR')
      });
    } finally {
      setIsLoading(false);
    }
  };

  const syncSingleSpace = async () => {
    setIsLoading(true);
    try {
      // Récupérer tous les espaces pour trouver le premier actif
      const spacesResponse = await apiClient.get('/spaces');
      
      if (!spacesResponse.success) {
        addResult({
          success: false,
          message: `Erreur récupération espaces: ${spacesResponse.error}`,
          timestamp: new Date().toLocaleString('fr-FR')
        });
        return;
      }

      const spaces = spacesResponse.data;
      const activeSpaces = spaces.filter(space => space.is_active);

      if (activeSpaces.length === 0) {
        addResult({
          success: false,
          message: 'Aucun espace actif trouvé',
          timestamp: new Date().toLocaleString('fr-FR')
        });
        return;
      }

      // Synchroniser le premier espace actif
      const space = activeSpaces[0];
      const response = await apiClient.post(`/stripe/sync-space/${space.id}`, {
        mode: selectedMode
      });
      
      if (response.success) {
        addResult({
          success: true,
          message: `Synchronisation Stripe espace "${space.name}": OK`,
          details: {
            space_id: response.data.space_id,
            stripe_product_id: response.data.stripe_product_id,
            prices: response.data.prices,
            mode: response.data.mode
          },
          timestamp: new Date().toLocaleString('fr-FR')
        });
      } else {
        addResult({
          success: false,
          message: `Erreur synchronisation: ${response.error || 'Inconnue'}`,
          details: response,
          timestamp: new Date().toLocaleString('fr-FR')
        });
      }
    } catch (error) {
      addResult({
        success: false,
        message: `Erreur: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: new Date().toLocaleString('fr-FR')
      });
    } finally {
      setIsLoading(false);
    }
  };

  const checkSyncStatus = async () => {
    setIsLoading(true);
    try {
      // Vérifier le statut de synchronisation Stripe
      const response = await apiClient.get('/stripe/sync-status');
      
      if (response.success) {
        addResult({
          success: true,
          message: `Statut Stripe: ${response.data.synced}/${response.data.total} espaces synchronisés (Mode: ${response.data.mode})`,
          details: {
            total: response.data.total,
            active: response.data.active,
            synced: response.data.synced,
            unsynced: response.data.unsynced,
            mode: response.data.mode,
            spaces: (response.data.spaces || []).slice(0, 5) // Afficher les 5 premiers espaces
          },
          timestamp: new Date().toLocaleString('fr-FR')
        });
      } else {
        addResult({
          success: false,
          message: `Erreur vérification statut: ${response.error || 'Inconnue'}`,
          details: response,
          timestamp: new Date().toLocaleString('fr-FR')
        });
      }
    } catch (error) {
      addResult({
        success: false,
        message: `Erreur: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: new Date().toLocaleString('fr-FR')
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Débogage Stripe
        </CardTitle>
        <CardDescription>
          Outils de diagnostic et de synchronisation Stripe
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Statut de connexion Stripe */}
        {stripeConnection && (
          <Alert className={stripeConnection.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
            <CheckCircle className={`h-4 w-4 ${stripeConnection.success ? 'text-green-600' : 'text-red-600'}`} />
            <AlertDescription>
              <strong>Connexion Stripe:</strong> {stripeConnection.success ? 'OK' : 'ÉCHEC'}
              {stripeConnection.account && (
                <span className="ml-2 text-sm text-gray-600">
                  (Mode: {stripeConnection.account.charges_enabled ? 'Live' : 'Test'})
                </span>
              )}
              {!stripeConnection.success && stripeConnection.error && (
                <div className="mt-1 text-sm text-red-600">
                  Erreur: {stripeConnection.error}
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Sélecteur de mode */}
        <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
          <label className="text-sm font-medium">Mode Stripe:</label>
          <select
            value={selectedMode}
            onChange={(e) => setSelectedMode(e.target.value as 'test' | 'live')}
            className="px-3 py-1 border rounded-md text-sm"
            disabled={isLoading}
          >
            <option value="test">Test</option>
            <option value="live">Production</option>
          </select>
          <Badge variant={selectedMode === 'live' ? 'destructive' : 'secondary'}>
            {selectedMode === 'live' ? 'Production' : 'Test'}
          </Badge>
        </div>

        {/* Boutons d'action */}
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={testStripeConnection}
            disabled={isLoading}
            variant="outline"
            size="sm"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Test Connexion
          </Button>

          <Button
            onClick={syncSingleSpace}
            disabled={isLoading}
            variant="outline"
            size="sm"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
            Sync 1 Espace
          </Button>

          <Button
            onClick={syncAllSpaces}
            disabled={isLoading}
            variant="outline"
            size="sm"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
            Sync Tous
          </Button>

          <Button
            onClick={checkSyncStatus}
            disabled={isLoading}
            variant="outline"
            size="sm"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <AlertCircle className="h-4 w-4" />}
            Statut
          </Button>
        </div>

        {/* Résultats */}
        {results.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Résultats récents:</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${
                    result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {result.success ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                      <span className="text-sm font-medium">
                        {result.message}
                      </span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {result.timestamp}
                    </Badge>
                  </div>
                  {/* Affichage de l'erreur Stripe si présente */}
                  {result.details && result.details.error_message && (
                    <div className="mt-2 text-xs text-red-700 bg-red-100 rounded p-2">
                      <strong>Erreur Stripe :</strong> {result.details.error_message}
                    </div>
                  )}
                  {result.details && result.details.details && result.details.details.error_message && (
                    <div className="mt-2 text-xs text-red-700 bg-red-100 rounded p-2">
                      <strong>Erreur Stripe :</strong> {result.details.details.error_message}
                    </div>
                  )}
                  {result.details && (
                    <details className="mt-2">
                      <summary className="text-xs text-gray-600 cursor-pointer">
                        Détails
                      </summary>
                      <pre className="mt-1 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                        {JSON.stringify(result.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 