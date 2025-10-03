import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, AlertCircle } from 'lucide-react';

interface ConnectionStatusProps {
  className?: string;
}

export const ConnectionStatus = ({ className }: ConnectionStatusProps) => {
  const [status, setStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    // Vérifier la vraie connexion à la base de données
    const checkConnection = async () => {
      try {
        // TODO: Remplacer par un vrai appel API de santé
        // const response = await apiClient.get('/health');
        // setStatus(response.connected ? 'connected' : 'error');
        
        // Pour l'instant, considérer comme connecté
        setStatus('connected');
        setLastUpdate(new Date());
      } catch (error) {
        setStatus('error');
        setLastUpdate(new Date());
      }
    };

    // Vérification initiale
    checkConnection();

    // Vérification périodique
    const interval = setInterval(checkConnection, 30000); // Toutes les 30 secondes

    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = () => {
    switch (status) {
      case 'connected':
        return <Wifi className="h-4 w-4 text-green-600" />;
      case 'error':
        return <WifiOff className="h-4 w-4 text-red-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'connected':
        return <Badge className="bg-green-100 text-green-800">Connecté</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800">Erreur</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">Connexion...</Badge>;
    }
  };

  return (
    <Card className={`${className} h-24`}>
      <CardHeader className="pb-1">
        <CardTitle className="flex items-center gap-1 text-xs">
          {getStatusIcon()}
          Statut de connexion
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-1">
          {getStatusBadge()}
          <p className="text-xs text-gray-500">
            {lastUpdate.toLocaleTimeString('fr-FR')}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
