import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ExternalLink, Calendar, DollarSign, CreditCard, User } from "lucide-react";
import type { Space } from "@/components/admin/types";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { saveAs } from "file-saver";

type Profile = {
  id: string;
  first_name?: string;
  last_name?: string;
  [key: string]: any;
};

type Booking = {
  id: string;
  user_id: string;
  space_id: string;
  start_time: string;
  end_time: string;
  status: string;
  user_name?: string;
  space_name?: string;
  [key: string]: any;
};

type Payment = {
  id: string;
  booking_id: string;
  amount: number;
  status: string;
  payment_method: string | null;
  payment_intent_id: string | null;
  invoice_url: string | null;
  created_at: string;
  updated_at: string;
  currency: string;
  booking?: Booking;
  mode: string;
  user_email?: string;
}

const AdminPayments = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState<'all' | 'live' | 'test'>('all');
  const [filterEmail, setFilterEmail] = useState('');
  const [filterAmountMin, setFilterAmountMin] = useState('');
  const [filterAmountMax, setFilterAmountMax] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      
      // Get payments from API
      const result = await apiClient.get('/payments');
      
      if (result.success && result.data) {
        setPayments(result.data);
      } else {
        console.error('Error fetching payments:', result.error);
        toast.error("Impossible de récupérer les paiements");
        setPayments([]);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast.error("Impossible de récupérer les paiements");
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'succeeded':
        return <span className="px-2 py-1 rounded bg-green-100 text-green-800 text-xs font-medium">Réussi</span>;
      case 'failed':
        return <span className="px-2 py-1 rounded bg-red-100 text-red-800 text-xs font-medium">Échoué</span>;
      case 'processing':
        return <span className="px-2 py-1 rounded bg-blue-100 text-blue-800 text-xs font-medium">En cours</span>;
      case 'refunded':
        return <span className="px-2 py-1 rounded bg-purple-100 text-purple-800 text-xs font-medium">Remboursé</span>;
      default:
        return <span className="px-2 py-1 rounded bg-yellow-100 text-yellow-800 text-xs font-medium">En attente</span>;
    }
  };

  // Filtrage avancé
  const filteredPayments = payments.filter((p) => {
    if (filterMode !== 'all' && p.mode !== filterMode) return false;
    if (filterEmail && !(p.user_email || '').toLowerCase().includes(filterEmail.toLowerCase())) return false;
    if (filterAmountMin && Number(p.amount) < Number(filterAmountMin)) return false;
    if (filterAmountMax && Number(p.amount) > Number(filterAmountMax)) return false;
    if (filterDateFrom && new Date(p.created_at) < new Date(filterDateFrom)) return false;
    if (filterDateTo && new Date(p.created_at) > new Date(filterDateTo)) return false;
    return true;
  });

  // Export CSV
  const exportCSV = () => {
    const headers = [
      'Date', 'Client', 'Email', 'Réservation', 'Montant', 'Devise', 'Méthode', 'Status', 'Mode'
    ];
    const rows = filteredPayments.map(p => [
      p.created_at,
      p.booking?.user_name || '',
      p.user_email || '',
      p.booking?.space_name || '',
      p.amount,
      p.currency || '',
      p.payment_method || '',
      p.status,
      p.mode
    ]);
    const csv = [headers, ...rows].map(r => r.map(x => `"${x ?? ''}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `paiements_${new Date().toISOString().slice(0,10)}.csv`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h2 className="text-2xl font-bold">Gestion des paiements</h2>
          <div className="flex gap-2 items-center mt-2 flex-wrap">
            <span>Filtrer par mode :</span>
            <Button variant={filterMode === 'all' ? 'default' : 'outline'} onClick={() => setFilterMode('all')}>Tous</Button>
            <Button variant={filterMode === 'live' ? 'default' : 'outline'} onClick={() => setFilterMode('live')}>Production</Button>
            <Button variant={filterMode === 'test' ? 'default' : 'outline'} onClick={() => setFilterMode('test')}>Test</Button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 items-end">
          <Input type="text" placeholder="Email client" value={filterEmail} onChange={e => setFilterEmail(e.target.value)} className="w-36" />
          <Input type="number" placeholder="Montant min" value={filterAmountMin} onChange={e => setFilterAmountMin(e.target.value)} className="w-28" />
          <Input type="number" placeholder="Montant max" value={filterAmountMax} onChange={e => setFilterAmountMax(e.target.value)} className="w-28" />
          <Input type="date" placeholder="Date de début" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} className="w-36" />
          <Input type="date" placeholder="Date de fin" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} className="w-36" />
          <Button variant="secondary" onClick={exportCSV}>Exporter CSV</Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Liste des paiements</CardTitle>
          <CardDescription>Suivez tous les paiements du système</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-4">Chargement des paiements...</p>
          ) : filteredPayments.length === 0 ? (
            <p className="text-center py-4">Aucun paiement trouvé.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Réservation</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Devise</TableHead>
                  <TableHead>Méthode</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span>{formatDate(payment.created_at)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span>{payment.booking?.user_name || 'Inconnu'}</span>
                      </div>
                    </TableCell>
                    <TableCell>{payment.user_email || ''}</TableCell>
                    <TableCell>
                      {payment.booking ? (
                        <span className="text-sm">{payment.booking.space_name}</span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold">{payment.amount} €</span>
                    </TableCell>
                    <TableCell>{payment.currency || ''}</TableCell>
                    <TableCell>{payment.payment_method || ''}</TableCell>
                    <TableCell>{getPaymentStatusBadge(payment.status)}</TableCell>
                    <TableCell>
                      <Badge color={payment.mode === 'live' ? 'green' : 'yellow'}>
                        {payment.mode === 'live' ? 'Production' : 'Test'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {payment.invoice_url ? (
                        <a href={payment.invoice_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPayments;
