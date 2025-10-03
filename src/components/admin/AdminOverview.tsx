import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdminStats } from "@/hooks/useAdminStats";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Users, Building2, Calendar, DollarSign } from "lucide-react";
import { RecentBookings } from "./dashboard/RecentBookings";
import { PopularSpaces } from "./dashboard/PopularSpaces";
import { AlertsPanel } from "./dashboard/AlertsPanel";


const AdminOverview = () => {
  const { data: stats, loading, error } = useAdminStats('live');

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('fr-FR').format(num);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="space-y-8">
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
    <div className="space-y-8">
      {/* Cartes de statistiques de base */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-xs font-medium text-blue-700">Utilisateurs</CardTitle>
            <Users className="h-3 w-3 text-blue-600" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-lg font-bold text-blue-900">{formatNumber(stats?.total_users || 0)}</div>
            <p className="text-xs text-blue-600">
              {stats?.active_users || 0} actifs
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-xs font-medium text-green-700">Espaces</CardTitle>
            <Building2 className="h-3 w-3 text-green-600" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-lg font-bold text-green-900">{formatNumber(stats?.total_spaces || 0)}</div>
            <p className="text-xs text-green-600">
              {stats?.available_spaces || 0} disponibles
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-xs font-medium text-purple-700">Réservations</CardTitle>
            <Calendar className="h-3 w-3 text-purple-600" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-lg font-bold text-purple-900">{formatNumber(stats?.total_bookings || 0)}</div>
            <p className="text-xs text-purple-600">
              {stats?.active_bookings || 0} actives
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-xs font-medium text-orange-700">Revenus</CardTitle>
            <DollarSign className="h-3 w-3 text-orange-600" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-lg font-bold text-orange-900">{formatCurrency(stats?.total_revenue || 0)}</div>
            <p className="text-xs text-orange-600">
              {formatCurrency(stats?.monthly_revenue || 0)} ce mois
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Information sur les données Stripe */}
      {stats?.stripe_customers === 0 && stats?.stripe_products === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <p className="text-sm text-blue-700">
              <strong>Mode Production :</strong> Aucune donnée Stripe live trouvée. 
              Les données s'afficheront automatiquement lorsque vous aurez des clients et produits en production.
            </p>
          </div>
        </div>
      )}

      {/* Cartes Stripe - Plus petites */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-xs font-medium text-indigo-700">Clients Stripe</CardTitle>
            <Users className="h-3 w-3 text-indigo-600" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-lg font-bold text-indigo-900">{formatNumber(stats?.stripe_customers || 0)}</div>
            <p className="text-xs text-indigo-600">
              Dans Stripe
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-xs font-medium text-emerald-700">Produits Stripe</CardTitle>
            <Building2 className="h-3 w-3 text-emerald-600" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-lg font-bold text-emerald-900">{formatNumber(stats?.stripe_products || 0)}</div>
            <p className="text-xs text-emerald-600">
              Catalogue
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-xs font-medium text-amber-700">Revenus Nets</CardTitle>
            <DollarSign className="h-3 w-3 text-amber-600" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-lg font-bold text-amber-900">{formatCurrency(stats?.net_revenue || 0)}</div>
            <p className="text-xs text-amber-600">
              Après frais
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-rose-50 to-rose-100 border-rose-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-xs font-medium text-rose-700">Revenus Bruts</CardTitle>
            <DollarSign className="h-3 w-3 text-rose-600" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-lg font-bold text-rose-900">{formatCurrency(stats?.total_revenue || 0)}</div>
            <p className="text-xs text-rose-600">
              Avant frais
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alertes, Espaces populaires et Réservations récentes */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <AlertsPanel mode="live" />
        <PopularSpaces 
          spaces={stats?.popular_spaces || []} 
          loading={loading} 
        />
        <RecentBookings 
          stats={stats} 
          loading={loading} 
          error={error} 
        />
      </div>
    </div>
  );
};

export default AdminOverview;
