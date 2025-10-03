import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  AlertCircle, 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  X, 
  Bell,
  Settings,
  RefreshCw
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface AlertItem {
  id: string;
  type: 'error' | 'warning' | 'success' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  dismissed?: boolean;
}

interface AlertsPanelProps {
  mode: 'test' | 'live';
}

export const AlertsPanel = ({ mode }: AlertsPanelProps) => {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Charger les alertes depuis l'API backend
    const loadAlerts = async () => {
      setLoading(true);
      try {
        const response = await apiClient.get(`/admin/alerts?mode=${mode}`);
        if (response.success) {
          // Convertir les timestamps string en Date objects
          const alertsWithDates = response.data.map((alert: any) => ({
            ...alert,
            timestamp: new Date(alert.timestamp)
          }));
          setAlerts(alertsWithDates);
        } else {
          console.error('Erreur récupération alertes:', response.error);
          setAlerts([]);
        }
      } catch (error) {
        console.error('Erreur chargement alertes:', error);
        setAlerts([]);
      } finally {
        setLoading(false);
      }
    };

    loadAlerts();
    
    // Rafraîchir les alertes toutes les 30 secondes
    const interval = setInterval(loadAlerts, 30000);
    return () => clearInterval(interval);
  }, [mode]);

  const dismissAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, dismissed: true } : alert
    ));
  };

  const getAlertIcon = (type: AlertItem['type']) => {
    switch (type) {
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-600" />;
      default:
        return <Info className="h-4 w-4 text-gray-600" />;
    }
  };

  const getAlertVariant = (type: AlertItem['type']) => {
    switch (type) {
      case 'error':
        return 'destructive';
      case 'warning':
        return 'default';
      case 'success':
        return 'default';
      case 'info':
        return 'default';
      default:
        return 'default';
    }
  };

  const getAlertBadgeColor = (type: AlertItem['type']) => {
    switch (type) {
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'info':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const activeAlerts = alerts.filter(alert => !alert.dismissed);
  const dismissedAlerts = alerts.filter(alert => alert.dismissed);

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Bell className="h-4 w-4" />
            Alertes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="animate-pulse">
              <div className="h-4 w-full bg-gray-200 rounded mb-2"></div>
              <div className="h-4 w-3/4 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 w-1/2 bg-gray-200 rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Alertes
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {activeAlerts.length} actives
            </Badge>
            <Button variant="outline" size="sm">
              <Settings className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Alertes actives */}
          {activeAlerts.length > 0 ? (
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-gray-700">Alertes actives</h4>
              {activeAlerts.map((alert) => (
                <Alert key={alert.id} variant={getAlertVariant(alert.type)}>
                  <div className="flex items-start gap-2">
                    {getAlertIcon(alert.type)}
                    <div className="flex-1">
                      <AlertTitle className="flex items-center gap-2">
                        {alert.title}
                        <Badge className={getAlertBadgeColor(alert.type)}>
                          {alert.type}
                        </Badge>
                      </AlertTitle>
                      <AlertDescription className="mt-1">
                        {alert.message}
                      </AlertDescription>
                      <div className="text-xs text-gray-500 mt-1">
                        {alert.timestamp.toLocaleString('fr-FR')}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => dismissAlert(alert.id)}
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </Alert>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <p className="text-gray-500">Aucune alerte active</p>
            </div>
          )}

          {/* Alertes supprimées */}
          {dismissedAlerts.length > 0 && (
            <div className="space-y-3 pt-4 border-t">
              <h4 className="font-medium text-sm text-gray-700">Alertes supprimées</h4>
              {dismissedAlerts.slice(0, 3).map((alert) => (
                <div key={alert.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    {getAlertIcon(alert.type)}
                    <span className="text-sm font-medium">{alert.title}</span>
                    <Badge className={getAlertBadgeColor(alert.type)}>
                      {alert.type}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {alert.timestamp.toLocaleString('fr-FR')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
