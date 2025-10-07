import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { virusTotalScanner } from '@/utils/virusTotalScanner';
import { 
  Shield, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw,
  ExternalLink,
  Info
} from 'lucide-react';
import { toast } from 'sonner';
// Logger supprimé - utilisation de console directement
interface ApiUsage {
  used: number;
  limit: number;
}

export const VirusTotalMonitor: React.FC = () => {
  const [apiUsage, setApiUsage] = useState<ApiUsage | null>(null);
  const [loading, setLoading] = useState(true);
  const [isApiAvailable, setIsApiAvailable] = useState(false);

  useEffect(() => {
    checkApiStatus();
  }, []);

  const checkApiStatus = async () => {
    setLoading(true);
    try {
      const available = virusTotalScanner.isApiAvailable();
      setIsApiAvailable(available);

      if (available) {
        const usage = await virusTotalScanner.getApiUsage();
        setApiUsage(usage);
      }
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'API:', error);
      toast.error('Erreur lors de la vérification de l\'API VirusTotal');
    } finally {
      setLoading(false);
    }
  };

  const getUsageColor = (used: number, limit: number) => {
    const percentage = (used / limit) * 100;
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getUsageStatus = (used: number, limit: number) => {
    const percentage = (used / limit) * 100;
    if (percentage >= 90) return { status: 'Critique', color: 'bg-red-100 text-red-800' };
    if (percentage >= 70) return { status: 'Attention', color: 'bg-yellow-100 text-yellow-800' };
    return { status: 'Normal', color: 'bg-green-100 text-green-800' };
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
            <span className="ml-2">Vérification de l'API VirusTotal...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Statut de l'API */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              <CardTitle>VirusTotal API</CardTitle>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={checkApiStatus}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Actualiser
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Statut de connexion */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Statut de l'API</span>
            <div className="flex items-center gap-2">
              {isApiAvailable ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <Badge className="bg-green-100 text-green-800">Connecté</Badge>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  <Badge className="bg-yellow-100 text-yellow-800">Scanner basique</Badge>
                </>
              )}
            </div>
          </div>

          {/* Utilisation de l'API */}
          {isApiAvailable && apiUsage && (
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Utilisation mensuelle</span>
                  <span className={`text-sm font-mono ${getUsageColor(apiUsage.used, apiUsage.limit)}`}>
                    {apiUsage.used} / {apiUsage.limit}
                  </span>
                </div>
                
                <Progress 
                  value={(apiUsage.used / apiUsage.limit) * 100} 
                  className="h-2"
                />
                
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{Math.round((apiUsage.used / apiUsage.limit) * 100)}% utilisé</span>
                  <Badge className={getUsageStatus(apiUsage.used, apiUsage.limit).color}>
                    {getUsageStatus(apiUsage.used, apiUsage.limit).status}
                  </Badge>
                </div>
              </div>

              {/* Alertes d'utilisation */}
              {apiUsage.used / apiUsage.limit >= 0.9 && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    <strong>Quota presque épuisé!</strong> Il vous reste {apiUsage.limit - apiUsage.used} requêtes ce mois.
                  </AlertDescription>
                </Alert>
              )}

              {apiUsage.used / apiUsage.limit >= 0.7 && apiUsage.used / apiUsage.limit < 0.9 && (
                <Alert className="border-yellow-200 bg-yellow-50">
                  <Info className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-800">
                    Vous avez utilisé {Math.round((apiUsage.used / apiUsage.limit) * 100)}% de votre quota mensuel.
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}

          {/* Configuration manquante */}
          {!isApiAvailable && (
            <Alert className="border-blue-200 bg-blue-50">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <div className="space-y-2">
                  <p><strong>API VirusTotal non configurée</strong></p>
                  <p className="text-sm">
                    Le système utilise actuellement un scanner basique. Pour une protection optimale, 
                    configurez votre clé API VirusTotal gratuite.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open('https://www.virustotal.com/gui/join-us', '_blank')}
                    className="flex items-center gap-2 mt-2"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Obtenir une clé API gratuite
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Informations sur VirusTotal */}
          <div className="pt-4 border-t">
            <h4 className="text-sm font-medium mb-2">À propos de VirusTotal</h4>
            <div className="text-xs text-gray-600 space-y-1">
              <p>• Service gratuit de Google avec 500 requêtes/mois</p>
              <p>• Analyse avec 70+ moteurs antivirus</p>
              <p>• Détection de malware, virus, et fichiers suspects</p>
              <p>• Fallback automatique vers scanner basique si indisponible</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistiques de sécurité */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-green-600" />
            Sécurité des fichiers
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">✓</div>
              <div className="text-sm text-green-800">Validation multi-niveaux</div>
            </div>
            
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">🛡️</div>
              <div className="text-sm text-blue-800">
                {isApiAvailable ? 'VirusTotal actif' : 'Scanner basique'}
              </div>
            </div>
            
            <div className="p-3 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">🔒</div>
              <div className="text-sm text-purple-800">Stockage sécurisé</div>
            </div>
            
            <div className="p-3 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">📊</div>
              <div className="text-sm text-orange-800">Audit complet</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VirusTotalMonitor; 