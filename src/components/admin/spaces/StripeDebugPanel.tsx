import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, AlertCircle, RefreshCw, Zap } from 'lucide-react';
import { supabase } from '@/lib/supabase';

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

  const addResult = (result: DebugResult) => {
    setResults(prev => [result, ...prev.slice(0, 9)]); // Garder les 10 derniers résultats
  };

  const testStripeConnection = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        addResult({
          success: false,
          message: 'Aucune session active',
          timestamp: new Date().toLocaleString('fr-FR')
        });
        return;
      }

      const response = await fetch(`https://exffryodynkyizbeesbt.supabase.co/functions/v1/stripe-sync-queue`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
          'x-verify-key': 'true'
        }
      });

      const data = await response.json();
      
      if (response.ok) {
        setStripeConnection(data.stripeConnection);
        addResult({
          success: true,
          message: `Connexion Stripe: ${data.stripeConnection.success ? 'OK' : 'ÉCHEC'}`,
          details: data,
          timestamp: new Date().toLocaleString('fr-FR')
        });
      } else {
        addResult({
          success: false,
          message: `Erreur ${response.status}: ${data.error || data.message}`,
          details: data,
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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        addResult({
          success: false,
          message: 'Aucune session active',
          timestamp: new Date().toLocaleString('fr-FR')
        });
        return;
      }

      // Récupérer tous les espaces
      const { data: spaces, error: spacesError } = await supabase
        .from('spaces')
        .select('id, name, pricing_type, hourly_price, daily_price, monthly_price')
        .eq('is_active', true);

      if (spacesError) {
        addResult({
          success: false,
          message: `Erreur récupération espaces: ${spacesError.message}`,
          timestamp: new Date().toLocaleString('fr-FR')
        });
        return;
      }

      // Créer des jobs pour tous les espaces
      const jobs = spaces.map(space => ({
        space_id: space.id,
        event_type: 'MANUAL_SYNC_ALL',
        payload: {
          space_id: space.id,
          space_name: space.name,
          pricing_type: space.pricing_type,
          timestamp: new Date().toISOString()
        },
        status: 'pending'
      }));

      const { error: insertError } = await supabase
        .from('stripe_sync_queue')
        .upsert(jobs, { onConflict: ['space_id', 'event_type'] });

      if (insertError) {
        addResult({
          success: false,
          message: `Erreur création jobs: ${insertError.message}`,
          timestamp: new Date().toLocaleString('fr-FR')
        });
        return;
      }

      // Déclencher la synchronisation
      const response = await fetch(`https://exffryodynkyizbeesbt.supabase.co/functions/v1/stripe-sync-queue`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (response.ok) {
        addResult({
          success: true,
          message: `Synchronisation déclenchée: ${data.message}`,
          details: data,
          timestamp: new Date().toLocaleString('fr-FR')
        });
      } else {
        addResult({
          success: false,
          message: `Erreur synchronisation: ${data.error || data.message}`,
          details: data,
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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        addResult({
          success: false,
          message: 'Aucune session active',
          timestamp: new Date().toLocaleString('fr-FR')
        });
        return;
      }

      // Récupérer tous les espaces actifs et filtrer côté JS
      const { data: spaces, error: spacesError } = await supabase
        .from('spaces')
        .select('id, name, pricing_type, hourly_price, daily_price, monthly_price')
        .eq('is_active', true);

      if (spacesError || !spaces || spaces.length === 0) {
        addResult({
          success: false,
          message: `Erreur récupération espaces: ${spacesError?.message || 'Aucun espace trouvé'}`,
          timestamp: new Date().toLocaleString('fr-FR')
        });
        return;
      }

      // Chercher explicitement l'espace 'test1234567'
      const space = spaces.find(s => s.name === 'test1234567') || spaces[0];

      // Créer un job pour cet espace
      const { error: insertError } = await supabase
        .from('stripe_sync_queue')
        .upsert({
          space_id: space.id,
          event_type: 'MANUAL_SYNC_SINGLE',
          payload: {
            space_id: space.id,
            space_name: space.name,
            pricing_type: space.pricing_type,
            timestamp: new Date().toISOString()
          },
          status: 'pending'
        }, { onConflict: ['space_id', 'event_type'] });

      if (insertError) {
        addResult({
          success: false,
          message: `Erreur création job: ${insertError.message}`,
          timestamp: new Date().toLocaleString('fr-FR')
        });
        return;
      }

      // Déclencher la synchronisation
      const response = await fetch(`https://exffryodynkyizbeesbt.supabase.co/functions/v1/stripe-sync-queue`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (response.ok) {
        addResult({
          success: true,
          message: `Synchronisation espace "${space.name}": ${data.message}`,
          details: data,
          timestamp: new Date().toLocaleString('fr-FR')
        });
      } else {
        addResult({
          success: false,
          message: `Erreur synchronisation: ${data.error || data.message}`,
          details: data,
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
      // Vérifier les jobs récents
      const { data: jobs, error: jobsError } = await supabase
        .from('stripe_sync_queue')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (jobsError) {
        addResult({
          success: false,
          message: `Erreur récupération jobs: ${jobsError.message}`,
          timestamp: new Date().toLocaleString('fr-FR')
        });
        return;
      }

      // Vérifier les espaces avec/sans IDs Stripe
      const { data: spaces, error: spacesError } = await supabase
        .from('spaces')
        .select('id, name, stripe_product_id, stripe_price_id, last_stripe_sync');

      if (spacesError) {
        addResult({
          success: false,
          message: `Erreur récupération espaces: ${spacesError.message}`,
          timestamp: new Date().toLocaleString('fr-FR')
        });
        return;
      }

      const syncedSpaces = spaces.filter(s => s.stripe_product_id && s.stripe_price_id);
      const unsyncedSpaces = spaces.filter(s => !s.stripe_product_id || !s.stripe_price_id);

      addResult({
        success: true,
        message: `Statut: ${syncedSpaces.length}/${spaces.length} espaces synchronisés`,
        details: {
          total: spaces.length,
          synced: syncedSpaces.length,
          unsynced: unsyncedSpaces.length,
          recentJobs: jobs.slice(0, 3)
        },
        timestamp: new Date().toLocaleString('fr-FR')
      });
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