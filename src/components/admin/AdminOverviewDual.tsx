import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdminStats } from "@/hooks/useAdminStats";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Users, Building2, Calendar, DollarSign, TestTube, Rocket } from "lucide-react";
import { RecentBookings } from "./dashboard/RecentBookings";
import { PopularSpaces } from "./dashboard/PopularSpaces";
import { AlertsPanel } from "./dashboard/AlertsPanel";

const AdminOverviewDual = () => {
  const { data: testStats, loading: testLoading, error: testError } = useAdminStats('test');
  const { data: liveStats, loading: liveLoading, error: liveError } = useAdminStats('live');

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('fr-FR').format(num);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const renderStatsCards = (stats: any, loading: boolean, error: any, mode: 'test' | 'live') => {
    if (loading) {
      return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  <Skeleton className="h-4 w-[100px]" />
                </CardTitle>
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-[60px]" />
                <Skeleton className="mt-2 h-4 w-[80px]" />
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>
            {error || "Une erreur est survenue lors du chargement du tableau de bord"}
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">Utilisateurs</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{formatNumber(stats?.total_users || 0)}</div>
            <p className="text-xs text-blue-600">
              {stats?.active_users || 0} actifs
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700">Espaces</CardTitle>
            <Building2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">{formatNumber(stats?.total_spaces || 0)}</div>
            <p className="text-xs text-green-600">
              {stats?.available_spaces || 0} disponibles
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-700">Réservations</CardTitle>
            <Calendar className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">{formatNumber(stats?.total_bookings || 0)}</div>
            <p className="text-xs text-purple-600">
              {stats?.active_bookings || 0} actives
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-700">Revenus</CardTitle>
            <DollarSign className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900">{formatCurrency(stats?.total_revenue || 0)}</div>
            <p className="text-xs text-orange-600">
              {formatCurrency(stats?.monthly_revenue || 0)} ce mois
            </p>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Section Mode Test */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <TestTube className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-blue-700">Mode Test</h2>
          <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
            Développement
          </div>
        </div>
        
        {renderStatsCards(testStats, testLoading, testError, 'test')}
        
        {/* Alertes, Espaces populaires et Réservations récentes - Mode Test */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <AlertsPanel mode="test" />
          <PopularSpaces 
            spaces={testStats?.popular_spaces || []} 
            loading={testLoading} 
          />
          <RecentBookings 
            stats={testStats} 
            loading={testLoading} 
            error={testError} 
          />
        </div>
      </div>

      {/* Séparateur */}
      <div className="border-t border-gray-200 my-8"></div>

      {/* Section Mode Production */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Rocket className="h-6 w-6 text-green-600" />
          <h2 className="text-2xl font-bold text-green-700">Mode Production</h2>
          <div className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
            Live
          </div>
        </div>
        
        {renderStatsCards(liveStats, liveLoading, liveError, 'live')}
        
        {/* Alertes, Espaces populaires et Réservations récentes - Mode Production */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <AlertsPanel mode="live" />
          <PopularSpaces 
            spaces={liveStats?.popular_spaces || []} 
            loading={liveLoading} 
          />
          <RecentBookings 
            stats={liveStats} 
            loading={liveLoading} 
            error={liveError} 
          />
        </div>
      </div>
    </div>
  );
};

export default AdminOverviewDual;
