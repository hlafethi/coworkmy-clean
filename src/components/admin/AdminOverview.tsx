import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdminStats } from "@/hooks/useAdminStats";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Users, Building2, Calendar, Euro } from "lucide-react";
import { RecentBookings } from "./dashboard/RecentBookings";

const AdminStats = () => {
  const { stats, loading, error } = useAdminStats();

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
  const StatsDisplay = () => {
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilisateurs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats.total_users)}</div>
            <p className="text-xs text-muted-foreground">
              {stats.active_users} actifs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Espaces</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats.total_spaces)}</div>
            <p className="text-xs text-muted-foreground">
              {stats.available_spaces} disponibles
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Réservations</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats.total_bookings)}</div>
            <p className="text-xs text-muted-foreground">
              {stats.active_bookings} actives
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenus</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.total_revenue)}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(stats.monthly_revenue)} ce mois
            </p>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {loading ? (
        <LoadingSkeleton />
      ) : error ? (
        <ErrorDisplay />
      ) : (
        <StatsDisplay />
      )}
      <RecentBookings />
    </div>
  );
};

const AdminOverview = () => {
  return (
    <div className="space-y-8">
      <AdminStats />
    </div>
  );
};

export default AdminOverview;
