import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Calendar, Euro, Users, AlertCircle } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { apiClient } from '@/lib/api-client';

interface StripeStatsData {
  date: string;
  reservations: number;
  annulations: number;
  revenus: number;
  revenus_nets: number;
  clients: number;
  tarifs_moyens: number;
}

interface StripeStatsChartProps {
  mode: 'test' | 'live';
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export const StripeStatsChart: React.FC<StripeStatsChartProps> = ({ mode }) => {
  const [data, setData] = useState<StripeStatsData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<'day' | 'month' | 'year'>('month');
  const [chartType, setChartType] = useState<'line' | 'bar' | 'pie'>('line');

  const fetchStripeStats = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log(`🔍 Récupération des stats Stripe pour mode: ${mode}, période: ${period}`);
      const response = await apiClient.get('/admin/stripe-stats', {
        params: { mode, period }
      });

      console.log('🔍 Réponse API Stripe stats:', response);

      if (response.success && response.data) {
        setData(response.data);
        console.log(`✅ Données récupérées: ${response.data.length} entrées`);
        
        if (response.data.length === 0) {
          console.log(`⚠️ Aucune donnée pour le mode ${mode}. Vérifiez la configuration Stripe.`);
        }
      } else {
        console.log('⚠️ Erreur dans la réponse:', response.error);
        setError(response.error || 'Erreur lors du chargement des données');
      }
    } catch (err) {
      console.error('❌ Erreur fetchStripeStats:', err);
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStripeStats();
  }, [mode, period]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (date: string) => {
    try {
      // Si c'est déjà une date formatée (YYYY-MM ou YYYY)
      if (date.includes('-') && date.length <= 7) {
        const [year, month] = date.split('-');
        if (period === 'month') {
          return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
        }
        return date;
      }
      
      // Si c'est une année seule
      if (date.length === 4 && !isNaN(parseInt(date))) {
        return date;
      }
      
      // Sinon, traiter comme une date complète
      const d = new Date(date);
      if (isNaN(d.getTime())) return date;
      
      switch (period) {
        case 'day':
          return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
        case 'month':
          return d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
        case 'year':
          return d.getFullYear().toString();
        default:
          return date;
      }
    } catch (error) {
      console.warn('Erreur formatDate:', error, 'pour date:', date);
      return date;
    }
  };

  const getTotalStats = () => {
    if (data.length === 0) return null;
    
    return {
      totalReservations: data.reduce((sum, item) => sum + item.reservations, 0),
      totalAnnulations: data.reduce((sum, item) => sum + item.annulations, 0),
      totalRevenus: data.reduce((sum, item) => sum + item.revenus, 0),
      totalRevenusNets: data.reduce((sum, item) => sum + item.revenus_nets, 0),
      totalClients: data.reduce((sum, item) => sum + item.clients, 0),
      tarifMoyen: data.reduce((sum, item) => sum + item.tarifs_moyens, 0) / data.length
    };
  };

  const totalStats = getTotalStats();

  const pieData = totalStats ? [
    { name: 'Réservations', value: totalStats.totalReservations, color: '#0088FE' },
    { name: 'Annulations', value: totalStats.totalAnnulations, color: '#FF8042' },
    { name: 'Clients', value: totalStats.totalClients, color: '#00C49F' }
  ] : [];

  const renderChart = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-64 text-red-500">
          <AlertCircle className="h-6 w-6 mr-2" />
          {error}
        </div>
      );
    }

    if (data.length === 0) {
      return (
        <div className="flex items-center justify-center h-64 text-gray-500">
          Aucune donnée disponible pour cette période
        </div>
      );
    }

    switch (chartType) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatDate}
                fontSize={12}
              />
              <YAxis fontSize={12} />
              <Tooltip 
                formatter={(value, name) => [
                  name === 'revenus' || name === 'revenus_nets' ? formatCurrency(Number(value)) : value,
                  name === 'reservations' ? 'Réservations' :
                  name === 'annulations' ? 'Annulations' :
                  name === 'revenus' ? 'Revenus' :
                  name === 'revenus_nets' ? 'Revenus nets' :
                  name === 'clients' ? 'Clients' : name
                ]}
                labelFormatter={(label) => `Date: ${formatDate(label)}`}
              />
              <Line type="monotone" dataKey="reservations" stroke="#0088FE" strokeWidth={2} />
              <Line type="monotone" dataKey="annulations" stroke="#FF8042" strokeWidth={2} />
              <Line type="monotone" dataKey="revenus" stroke="#00C49F" strokeWidth={2} />
              <Line type="monotone" dataKey="clients" stroke="#8884D8" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        );
      
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatDate}
                fontSize={12}
              />
              <YAxis fontSize={12} />
              <Tooltip 
                formatter={(value, name) => [
                  name === 'revenus' || name === 'revenus_nets' ? formatCurrency(Number(value)) : value,
                  name === 'reservations' ? 'Réservations' :
                  name === 'annulations' ? 'Annulations' :
                  name === 'revenus' ? 'Revenus' :
                  name === 'revenus_nets' ? 'Revenus nets' :
                  name === 'clients' ? 'Clients' : name
                ]}
                labelFormatter={(label) => `Date: ${formatDate(label)}`}
              />
              <Bar dataKey="reservations" fill="#0088FE" />
              <Bar dataKey="annulations" fill="#FF8042" />
              <Bar dataKey="revenus" fill="#00C49F" />
              <Bar dataKey="clients" fill="#8884D8" />
            </BarChart>
          </ResponsiveContainer>
        );
      
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={300}>
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
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );
      
      default:
        return null;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Statistiques Stripe - Mode {mode === 'test' ? 'Test' : 'Production'}
          </CardTitle>
          <div className="flex gap-2">
            <Select value={period} onValueChange={(value: 'day' | 'month' | 'year') => setPeriod(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Jour</SelectItem>
                <SelectItem value="month">Mois</SelectItem>
                <SelectItem value="year">Année</SelectItem>
              </SelectContent>
            </Select>
            <Select value={chartType} onValueChange={(value: 'line' | 'bar' | 'pie') => setChartType(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="line">Ligne</SelectItem>
                <SelectItem value="bar">Barres</SelectItem>
                <SelectItem value="pie">Camembert</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchStripeStats}
              disabled={loading}
            >
              <Calendar className="h-4 w-4 mr-1" />
              Actualiser
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Statistiques totales */}
        {totalStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-center mb-1">
                <Users className="h-4 w-4 text-blue-600 mr-1" />
                <span className="text-sm font-medium text-blue-600">Réservations</span>
              </div>
              <div className="text-xl font-bold text-blue-800">{totalStats.totalReservations}</div>
            </div>
            
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="flex items-center justify-center mb-1">
                <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
                <span className="text-sm font-medium text-red-600">Annulations</span>
              </div>
              <div className="text-xl font-bold text-red-800">{totalStats.totalAnnulations}</div>
            </div>
            
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="flex items-center justify-center mb-1">
                <Euro className="h-4 w-4 text-green-600 mr-1" />
                <span className="text-sm font-medium text-green-600">Revenus</span>
              </div>
              <div className="text-lg font-bold text-green-800">{formatCurrency(totalStats.totalRevenus)}</div>
            </div>
            
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="flex items-center justify-center mb-1">
                <TrendingUp className="h-4 w-4 text-purple-600 mr-1" />
                <span className="text-sm font-medium text-purple-600">Clients</span>
              </div>
              <div className="text-xl font-bold text-purple-800">{totalStats.totalClients}</div>
            </div>
          </div>
        )}

        {/* Graphique */}
        <div className="h-80">
          {renderChart()}
        </div>
      </CardContent>
    </Card>
  );
};
