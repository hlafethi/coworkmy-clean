import { usePayments } from '@/hooks/usePayments';
import { formatPaymentAmount, formatPaymentDate, getPaymentStatusColor, getPaymentStatusText } from '@/services/paymentService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, ExternalLink, Download } from 'lucide-react';
import { toast } from 'sonner';

export function PaymentList() {
  const { payments, loading, error, refreshPayments } = usePayments();

  const handleRefresh = () => {
    refreshPayments();
    toast.success('Liste des paiements actualisée');
  };

  const handleExportCSV = () => {
    if (payments.length === 0) {
      toast.error('Aucun paiement à exporter');
      return;
    }

    const csvContent = [
      ['ID', 'Date', 'Client', 'Montant', 'Statut', 'Description'],
      ...payments.map(payment => [
        payment.id,
        formatPaymentDate(payment.created),
        payment.customer?.email || 'N/A',
        formatPaymentAmount(payment.amount, payment.currency),
        getPaymentStatusText(payment.status),
        payment.description || 'N/A'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `paiements_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Export CSV téléchargé');
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            <span>Chargement des paiements...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <p className="text-red-600 mb-4">Erreur lors du chargement des paiements</p>
            <p className="text-sm text-gray-600 mb-4">{error}</p>
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Réessayer
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Liste des paiements</CardTitle>
          <div className="flex gap-2">
            <Button onClick={handleRefresh} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
            <Button onClick={handleExportCSV} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exporter CSV
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {payments.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Aucun paiement trouvé</p>
            <p className="text-sm text-gray-400 mt-2">
              Les paiements apparaîtront ici une fois que les clients auront effectué des réservations
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {payments.map((payment) => (
              <div key={payment.id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="font-medium">{payment.customer?.email || 'Client inconnu'}</p>
                        <p className="text-sm text-gray-500">
                          {formatPaymentDate(payment.created)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-lg">
                          {formatPaymentAmount(payment.amount, payment.currency)}
                        </p>
                        <Badge className={getPaymentStatusColor(payment.status)}>
                          {getPaymentStatusText(payment.status)}
                        </Badge>
                      </div>
                    </div>
                    {payment.description && (
                      <p className="text-sm text-gray-600 mt-2">{payment.description}</p>
                    )}
                    {payment.metadata?.booking_id && (
                      <p className="text-xs text-gray-500 mt-1">
                        Réservation: {payment.metadata.booking_id}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
