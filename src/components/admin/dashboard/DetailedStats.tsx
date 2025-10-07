import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, TrendingUp, Calendar, DollarSign, Users, Building2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { apiClient } from '@/lib/api-client';
// Logger supprimé - utilisation de console directement
interface DetailedStatsData {
  date: string;
  users: number;
  spaces: number;
  bookings: number;
  revenue: number;
}

interface DetailedStatsProps {
  mode: 'test' | 'live';
  period: 'day' | 'month' | 'year';
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export const DetailedStats = ({ mode, period }: DetailedStatsProps) => {
  const [data, setData] = useState<DetailedStatsData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetailedStats = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await apiClient.get(`/admin/detailed-stats?mode=${mode}&period=${period}`);
        
        if (!response.success) {
          throw new Error(response.error || 'Erreur lors du chargement des statistiques détaillées');
        }
        
        setData(response.data || []);
      } catch (err) {
        console.error('Erreur chargement stats détaillées:', err);
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      } finally {
        setLoading(false);
      }
    };

    fetchDetailedStats();
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
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Détails - {mode}
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
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Détails - {mode}
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
            Détails - {mode}
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

  // Données pour le graphique en secteurs
  const pieData = [
    { name: 'Utilisateurs', value: data.reduce((sum, item) => sum + item.users, 0) },
    { name: 'Espaces', value: data.reduce((sum, item) => sum + item.spaces, 0) },
    { name: 'Réservations', value: data.reduce((sum, item) => sum + item.bookings, 0) },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Détails - {mode}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Graphique linéaire des tendances */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Évolution des métriques
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={data}>
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
                      name === 'users' ? 'Utilisateurs' : 
                      name === 'spaces' ? 'Espaces' : 
                      name === 'bookings' ? 'Réservations' : 
                      name === 'revenue' ? 'Revenus' : name
                    ]}
                    labelFormatter={(label) => `Date: ${formatDate(label)}`}
                  />
                  <Line type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={2} name="Utilisateurs" />
                  <Line type="monotone" dataKey="spaces" stroke="#10b981" strokeWidth={2} name="Espaces" />
                  <Line type="monotone" dataKey="bookings" stroke="#f59e0b" strokeWidth={2} name="Réservations" />
                  <Line type="monotone" dataKey="revenue" stroke="#ef4444" strokeWidth={2} name="Revenus" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Graphique en barres des revenus */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Évolution des revenus
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data}>
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
                    formatter={(value: number) => [formatCurrency(value), 'Revenus']}
                    labelFormatter={(label) => `Date: ${formatDate(label)}`}
                  />
                  <Bar dataKey="revenue" fill="#3b82f6" name="Revenus" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Graphique en secteurs */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Répartition des métriques
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Résumé des statistiques */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Utilisateurs
                </h4>
                <p className="text-2xl font-bold text-blue-600">
                  {data.reduce((sum, item) => sum + item.users, 0)}
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium text-green-900 flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Espaces
                </h4>
                <p className="text-2xl font-bold text-green-600">
                  {data.reduce((sum, item) => sum + item.spaces, 0)}
                </p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h4 className="font-medium text-yellow-900 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Réservations
                </h4>
                <p className="text-2xl font-bold text-yellow-600">
                  {data.reduce((sum, item) => sum + item.bookings, 0)}
                </p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <h4 className="font-medium text-red-900 flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Revenus
                </h4>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(data.reduce((sum, item) => sum + item.revenue, 0))}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
