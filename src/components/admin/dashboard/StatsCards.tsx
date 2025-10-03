import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Building2, Calendar, DollarSign, TrendingUp, Activity } from 'lucide-react';

interface StatsCardsProps {
  stats: {
    total_users: number;
    active_users: number;
    total_spaces: number;
    available_spaces: number;
    total_bookings: number;
    active_bookings: number;
    total_revenue: number;
    monthly_revenue: number;
    stripe_customers?: number;
    stripe_products?: number;
    net_revenue?: number;
  };
  loading: boolean;
  mode: 'test' | 'live';
}

export const StatsCards = ({ stats, loading, mode }: StatsCardsProps) => {

  const formatNumber = (num: number) => {
    // S'assurer que c'est un nombre valide
    const validNum = typeof num === 'number' && !isNaN(num) ? num : 0;
    return new Intl.NumberFormat('fr-FR').format(validNum);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-7 gap-2">
        {[...Array(7)].map((_, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
              <CardTitle className="text-xs font-medium">
                <Skeleton className="h-3 w-[60px]" />
              </CardTitle>
              <Skeleton className="h-3 w-3" />
            </CardHeader>
            <CardContent className="pt-1">
              <Skeleton className="h-5 w-[40px]" />
              <Skeleton className="mt-1 h-3 w-[50px]" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-7 gap-2">
      {/* Cartes principales */}
      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
          <CardTitle className="text-xs font-medium text-blue-700">Utilisateurs</CardTitle>
          <Users className="h-3 w-3 text-blue-600" />
        </CardHeader>
        <CardContent className="pt-1">
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
        <CardContent className="pt-1">
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
        <CardContent className="pt-1">
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
        <CardContent className="pt-1">
          <div className="text-lg font-bold text-orange-900">{formatCurrency(stats?.total_revenue || 0)}</div>
          <p className="text-xs text-orange-600">
            {formatCurrency(stats?.monthly_revenue || 0)} ce mois
          </p>
        </CardContent>
      </Card>

      {/* Statistiques Stripe */}
      <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
          <CardTitle className="text-xs font-medium text-indigo-700">Clients</CardTitle>
          <Users className="h-3 w-3 text-indigo-600" />
        </CardHeader>
        <CardContent className="pt-1">
          <div className="text-lg font-bold text-indigo-900">{formatNumber(stats?.stripe_customers || 0)}</div>
          <p className="text-xs text-indigo-600">
            {mode}
          </p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-teal-50 to-teal-100 border-teal-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
          <CardTitle className="text-xs font-medium text-teal-700">Produits</CardTitle>
          <Building2 className="h-3 w-3 text-teal-600" />
        </CardHeader>
        <CardContent className="pt-1">
          <div className="text-lg font-bold text-teal-900">{formatNumber(stats?.stripe_products || 0)}</div>
          <p className="text-xs text-teal-600">
            Catalogue
          </p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-rose-50 to-rose-100 border-rose-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
          <CardTitle className="text-xs font-medium text-rose-700">Nets</CardTitle>
          <DollarSign className="h-3 w-3 text-rose-600" />
        </CardHeader>
        <CardContent className="pt-1">
          <div className="text-lg font-bold text-rose-900">{formatCurrency(stats?.net_revenue || 0)}</div>
          <p className="text-xs text-rose-600">
            Frais
          </p>
        </CardContent>
      </Card>
    </div>
  );
};