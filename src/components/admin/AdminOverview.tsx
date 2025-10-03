import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdminStats } from "@/hooks/useAdminStats";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Users, Building2, Calendar, Euro } from "lucide-react";
import { RecentBookings } from "./dashboard/RecentBookings";
import { StripeStatsChart } from "./dashboard/StripeStatsChart";
// ModeFilters supprimé - affichage des deux modes simultanément
import { useState } from "react";

const AdminStats = ({ mode }: { mode: 'test' | 'live' }) => {
  const { data: stats, loading, error } = useAdminStats(mode);

  // Composant de chargement
  const LoadingSkeleton = () => (
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

  // Composant d'erreur
  const ErrorDisplay = () => (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Erreur</AlertTitle>
      <AlertDescription>
        {error || "Une erreur est survenue lors du chargement du tableau de bord"}
      </AlertDescription>
    </Alert>
  );

  // Composant de statistiques
  const StatsDisplay = ({ stats, mode }: { stats: any, mode: 'test' | 'live' }) => {
    const formatNumber = (num: number) => {
      return new Intl.NumberFormat('fr-FR').format(num);
    };

    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR'
      }).format(amount);
    };

    return (
      <div className="grid gap-2 grid-cols-2">
        {/* Utilisateurs - Bleu */}
        <Card className="border-l-2 border-l-blue-500 bg-blue-50/30 p-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-blue-700">Utilisateurs</span>
            <Users className="h-3 w-3 text-blue-600" />
          </div>
          <div className="text-sm font-bold text-blue-900">{formatNumber(stats?.total_users || 0)}</div>
          <p className="text-xs text-blue-600">{stats?.active_users || 0} actifs</p>
          {stats?.stripe_customers !== undefined && (
            <p className="text-xs text-blue-500">
              {stats.stripe_customers} clients Stripe
            </p>
          )}
        </Card>

        {/* Espaces - Vert */}
        <Card className="border-l-2 border-l-green-500 bg-green-50/30 p-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-green-700">Espaces</span>
            <Building2 className="h-3 w-3 text-green-600" />
          </div>
          <div className="text-sm font-bold text-green-900">{formatNumber(stats?.total_spaces || 0)}</div>
          <p className="text-xs text-green-600">{stats?.available_spaces || 0} disponibles</p>
          {stats?.stripe_products !== undefined && (
            <p className="text-xs text-green-500">
              {stats.stripe_products} produits Stripe
            </p>
          )}
        </Card>

        {/* Réservations - Orange */}
        <Card className="border-l-2 border-l-orange-500 bg-orange-50/30 p-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-orange-700">Réservations</span>
            <Calendar className="h-3 w-3 text-orange-600" />
          </div>
          <div className="text-sm font-bold text-orange-900">{formatNumber(stats?.total_bookings || 0)}</div>
          <p className="text-xs text-orange-600">{stats?.active_bookings || 0} actives</p>
        </Card>

        {/* Revenus - Violet */}
        <Card className="border-l-2 border-l-purple-500 bg-purple-50/30 p-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-purple-700">Revenus</span>
            <Euro className="h-3 w-3 text-purple-600" />
          </div>
          <div className="text-sm font-bold text-purple-900">{formatCurrency(stats?.total_revenue || 0)}</div>
          <p className="text-xs text-purple-600">{formatCurrency(stats?.monthly_revenue || 0)} ce mois</p>
        </Card>

        {/* Revenus Nets - Rose */}
        <Card className="border-l-2 border-l-pink-500 bg-pink-50/30 p-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-pink-700">Revenus Nets</span>
            <Euro className="h-3 w-3 text-pink-600" />
          </div>
          <div className="text-sm font-bold text-pink-900">{formatCurrency(stats?.total_net_revenue || 0)}</div>
          <p className="text-xs text-pink-600">{formatCurrency(stats?.monthly_net_revenue || 0)} ce mois</p>
        </Card>
      </div>
    );
  };

  return (
    <>
      {loading ? (
        <LoadingSkeleton />
      ) : error ? (
        <ErrorDisplay />
      ) : (
        <StatsDisplay stats={stats} mode={mode} />
      )}
    </>
  );
};

const AdminOverview = () => {
  const { data: testStats, loading: testLoading, error: testError } = useAdminStats('test');
  const { data: liveStats, loading: liveLoading, error: liveError } = useAdminStats('live');

  return (
    <div className="space-y-6">
      {/* Graphiques des statistiques Stripe */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <StripeStatsChart mode="test" />
        <StripeStatsChart mode="live" />
      </div>

      {/* Deux colonnes : Test et Production */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Colonne Mode Test */}
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-amber-700 mb-2 flex items-center gap-2">
            <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
            Mode Test
          </h2>
          <AdminStats mode="test" />
          <RecentBookings stats={testStats} loading={testLoading} error={testError} />
        </div>

        {/* Colonne Mode Production */}
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-blue-700 mb-2 flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            Mode Production
          </h2>
          <AdminStats mode="live" />
          <RecentBookings stats={liveStats} loading={liveLoading} error={liveError} />
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;
