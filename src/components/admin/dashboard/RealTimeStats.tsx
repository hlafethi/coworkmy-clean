import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, RefreshCw, Activity, TrendingUp } from 'lucide-react';
import { useAdminStats } from '@/hooks/useAdminStats';
import { logger } from '@/utils/logger';

interface RealTimeStatsProps {
  mode: 'test' | 'live';
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export const RealTimeStats = ({ 
  mode, 
  autoRefresh = true, 
  refreshInterval = 30000 
}: RealTimeStatsProps) => {
  const { stats, loading, error, refreshStats } = useAdminStats(mode);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // Utiliser la fonction refreshStats du hook au lieu de recharger la page
      await refreshStats();
      setLastUpdate(new Date());
    } catch (err) {
      logger.error('Erreur lors du rafraîchissement:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshStats]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      handleRefresh();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, handleRefresh]);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('fr-FR').format(num);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  if (loading && !stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Statistiques en temps réel - Mode {mode}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Statistiques en temps réel - Mode {mode}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erreur</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-24">
      <CardHeader className="pb-1">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-1 text-xs">
            <Activity className="h-3 w-3" />
            Temps réel - {mode}
          </CardTitle>
          <div className="flex items-center gap-1">
            <Badge variant="outline" className="text-xs">
              {autoRefresh ? 'Auto' : 'Manuel'}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-1 h-5 px-1 text-xs"
            >
              <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-1">
          {/* Métriques principales ultra-compactes */}
          <div className="grid grid-cols-4 gap-1">
            <div className="text-center p-1 bg-blue-50 rounded">
              <div className="text-sm font-bold text-blue-600">
                {isRefreshing ? '...' : formatNumber(stats?.total_users || 0)}
              </div>
              <div className="text-xs text-blue-500">Users</div>
            </div>
            <div className="text-center p-1 bg-green-50 rounded">
              <div className="text-sm font-bold text-green-600">
                {isRefreshing ? '...' : formatNumber(stats?.total_spaces || 0)}
              </div>
              <div className="text-xs text-green-500">Spaces</div>
            </div>
            <div className="text-center p-1 bg-purple-50 rounded">
              <div className="text-sm font-bold text-purple-600">
                {isRefreshing ? '...' : formatNumber(stats?.total_bookings || 0)}
              </div>
              <div className="text-xs text-purple-500">Bookings</div>
            </div>
            <div className="text-center p-1 bg-orange-50 rounded">
              <div className="text-sm font-bold text-orange-600">
                {isRefreshing ? '...' : formatCurrency(stats?.total_revenue || 0)}
              </div>
              <div className="text-xs text-orange-500">Revenue</div>
            </div>
          </div>

          {/* Informations de mise à jour ultra-compactes */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <TrendingUp className={`h-3 w-3 ${isRefreshing ? 'animate-pulse' : ''}`} />
              <span>{lastUpdate.toLocaleTimeString('fr-FR')}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${isRefreshing ? 'bg-yellow-500 animate-pulse' : autoRefresh ? 'bg-green-500' : 'bg-gray-400'}`}></div>
              <span className="text-xs">{isRefreshing ? 'Mise à jour...' : autoRefresh ? 'Auto' : 'Manuel'}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
