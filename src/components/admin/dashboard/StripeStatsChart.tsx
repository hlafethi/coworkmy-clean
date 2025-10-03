import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, TrendingUp, Calendar, DollarSign } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { apiClient } from '@/lib/api-client';

interface StripeStatsData {
  date: string;
  revenue: number;
  bookings: number;
  cancellations: number;
  net_revenue: number;
}

interface StripeStatsChartProps {
  mode: 'test' | 'live';
  period: 'day' | 'month' | 'year';
}

export const StripeStatsChart = ({ mode, period }: StripeStatsChartProps) => {
  const [data, setData] = useState<StripeStatsData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStripeStats = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await apiClient.get(`/admin/stripe-stats?mode=${mode}&period=${period}`);
        
        if (!response.success) {
          throw new Error(response.error || 'Erreur lors du chargement des statistiques Stripe');
        }
        
        setData(response.data || []);
      } catch (err) {
        console.error('Erreur chargement stats Stripe:', err);
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      } finally {
        setLoading(false);
      }
    };

    fetchStripeStats();
  }, [mode, period]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    switch (period) {
      case 'day':
        return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
      case 'month':
        return date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
      case 'year':
        return date.getFullYear().toString();
      default:
        return dateStr;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(value);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Stripe - {mode}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-64 w-full" />
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
            <TrendingUp className="h-5 w-5" />
            Stripe - {mode}
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

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Stripe - {mode}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Aucune donnée disponible pour cette période</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Stripe - {mode}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Graphique des revenus */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Évolution des revenus
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={formatDate}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    tickFormatter={(value) => `${value}€`}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    formatter={(value: number, name: string) => [
                      formatCurrency(value), 
                      name === 'revenue' ? 'Revenus bruts' : 
                      name === 'net_revenue' ? 'Revenus nets' : name
                    ]}
                    labelFormatter={(label) => `Date: ${formatDate(label)}`}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    name="Revenus bruts"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="net_revenue" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    name="Revenus nets"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Graphique des réservations */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Réservations et annulations
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={formatDate}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    formatter={(value: number, name: string) => [
                      value, 
                      name === 'bookings' ? 'Réservations' : 'Annulations'
                    ]}
                    labelFormatter={(label) => `Date: ${formatDate(label)}`}
                  />
                  <Bar dataKey="bookings" fill="#3b82f6" name="Réservations" />
                  <Bar dataKey="cancellations" fill="#ef4444" name="Annulations" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Résumé des statistiques */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900">Revenus totaux</h4>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(data.reduce((sum, item) => sum + item.revenue, 0))}
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium text-green-900">Revenus nets</h4>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(data.reduce((sum, item) => sum + item.net_revenue, 0))}
                </p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <h4 className="font-medium text-purple-900">Réservations</h4>
                <p className="text-2xl font-bold text-purple-600">
                  {data.reduce((sum, item) => sum + item.bookings, 0)}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
