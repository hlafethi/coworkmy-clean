import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, CheckCircle, AlertCircle, ExternalLink } from "lucide-react";
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';

interface SyncResult {
  space_id: number;
  space_name: string;
  product_id?: string;
  prices?: Array<{ type: string; price_id: string }>;
  error?: string;
}

interface SyncResponse {
  message: string;
  mode: string;
  synced: number;
  results: SyncResult[];
}

export const StripeSync: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [lastSync, setLastSync] = useState<SyncResponse | null>(null);
  const [selectedMode, setSelectedMode] = useState<'test' | 'live'>('test');

  const handleSync = async () => {
    try {
      setLoading(true);
      
      const response = await apiClient.post('/stripe/sync-spaces', {
        mode: selectedMode
      });

      if (response.success) {
        setLastSync(response.data);
        toast.success(`Synchronisation réussie: ${response.data.synced} espaces traités`);
      } else {
        toast.error(response.error || 'Erreur lors de la synchronisation');
      }
    } catch (error) {
      console.error('Erreur synchronisation:', error);
      toast.error('Erreur de connexion lors de la synchronisation');
    } finally {
      setLoading(false);
    }
  };

  const getModeBadge = (mode: string) => {
    return mode === 'live' ? (
      <Badge variant="destructive">Production</Badge>
    ) : (
      <Badge variant="secondary">Test</Badge>
    );
  };

  const getResultIcon = (result: SyncResult) => {
    if (result.error) {
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Synchronisation Stripe
          </CardTitle>
          <CardDescription>
            Synchronisez vos espaces vers le catalogue Stripe pour les paiements
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Mode:</label>
              <select
                value={selectedMode}
                onChange={(e) => setSelectedMode(e.target.value as 'test' | 'live')}
                className="px-3 py-1 border rounded-md text-sm"
                disabled={loading}
              >
                <option value="test">Test</option>
                <option value="live">Production</option>
              </select>
              {getModeBadge(selectedMode)}
            </div>
            
            <Button
              onClick={handleSync}
              disabled={loading}
              className="flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Synchronisation...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Synchroniser
                </>
              )}
            </Button>
          </div>

          {selectedMode === 'live' && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
              <div className="flex items-center gap-2 text-amber-800">
                <AlertCircle className="h-4 w-4" />
                <span className="font-medium">Mode Production</span>
              </div>
              <p className="text-sm text-amber-700 mt-1">
                Vous synchronisez vers Stripe en mode production. 
                Les espaces seront visibles dans votre catalogue live.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {lastSync && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Résultat de la synchronisation
            </CardTitle>
            <CardDescription>
              Mode: {getModeBadge(lastSync.mode)} • {lastSync.synced} espaces traités
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {lastSync.results.map((result, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getResultIcon(result)}
                    <div>
                      <p className="font-medium">{result.space_name}</p>
                      {result.error ? (
                        <p className="text-sm text-red-600">{result.error}</p>
                      ) : (
                        <div className="text-sm text-gray-600">
                          <p>Produit: {result.product_id}</p>
                          {result.prices && result.prices.length > 0 && (
                            <p>Prix: {result.prices.map(p => p.type).join(', ')}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {result.product_id && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const url = selectedMode === 'live' 
                          ? `https://dashboard.stripe.com/products/${result.product_id}`
                          : `https://dashboard.stripe.com/test/products/${result.product_id}`;
                        window.open(url, '_blank');
                      }}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
