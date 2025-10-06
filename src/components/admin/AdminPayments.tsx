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
import { ExternalLink, Calendar, DollarSign, CreditCard, User, Eye, Trash2 } from "lucide-react";
import type { Space } from "@/components/admin/types";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { saveAs } from "file-saver";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { refundStripePayment } from "@/services/paymentService";
import { logger } from '@/utils/logger';

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
  const [filterStatus, setFilterStatus] = useState<'all' | 'succeeded' | 'failed' | 'processing' | 'refunded' | 'pending'>('all');
  const [filterEmail, setFilterEmail] = useState('');
  const [filterAmountMin, setFilterAmountMin] = useState('');
  const [filterAmountMax, setFilterAmountMax] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  
  // États pour les modales
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<Payment | null>(null);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      
      // Get payments from Stripe API
      const result = await apiClient.get('/stripe/payments');
      
      if (result.success && result.data) {
        // Convertir les données Stripe vers notre format
        const paymentsData = Array.isArray(result.data) ? result.data.map((stripePayment: any) => {
          // Debug: Log des données Stripe pour comprendre la structure
          logger.debug('🔍 Debug paiement Stripe:', {
            id: stripePayment.id,
            status: stripePayment.status,
            charges: stripePayment.charges?.data?.length || 0,
            chargesData: stripePayment.charges?.data
          });
          
          // Vérifier si le paiement a des remboursements
          let hasRefunds = false;
          
          // Utiliser la nouvelle propriété has_refunds du backend
          if (stripePayment.has_refunds === true) {
            hasRefunds = true;
            logger.debug('✅ Remboursements détectés via has_refunds:', stripePayment.id);
          } else {
            // Fallback: vérifier les charges (ancienne méthode)
            if (stripePayment.charges?.data) {
              for (const charge of stripePayment.charges.data) {
                logger.debug('🔍 Debug charge:', {
                  id: charge.id,
                  refunded: charge.refunded,
                  refunds: charge.refunds?.data?.length || 0,
                  refundsData: charge.refunds?.data
                });
                
                // Vérifier si la charge est remboursée
                if (charge.refunded === true) {
                  hasRefunds = true;
                  break;
                }
                
                // Vérifier s'il y a des remboursements dans les données
                if (charge.refunds && charge.refunds.data && charge.refunds.data.length > 0) {
                  hasRefunds = true;
                  break;
                }
              }
            }
          }
          
          // Déterminer le statut final
          let finalStatus = stripePayment.status;
          if (hasRefunds) {
            finalStatus = 'refunded';
            logger.debug('✅ Paiement remboursé détecté:', stripePayment.id);
          }
          
          return {
            id: stripePayment.id,
            booking_id: stripePayment.metadata?.booking_id || '',
            amount: stripePayment.amount / 100, // Convertir de centimes en euros
            status: finalStatus,
            payment_method: stripePayment.payment_method_types?.[0] || 'card',
            payment_intent_id: stripePayment.id,
            invoice_url: stripePayment.charges?.data?.[0]?.receipt_url || null,
            created_at: new Date(stripePayment.created * 1000).toISOString(),
            updated_at: new Date(stripePayment.created * 1000).toISOString(),
            currency: stripePayment.currency,
            mode: 'test', // Pour l'instant, on assume que c'est en mode test
            user_email: stripePayment.customer?.email || '',
            description: stripePayment.description || '',
            metadata: stripePayment.metadata
          };
        }) : [];
        setPayments(paymentsData);
        logger.debug(`✅ ${paymentsData.length} paiements Stripe récupérés`);
      } else {
        logger.error('Error fetching payments:', result.error);
        toast.error("Impossible de récupérer les paiements");
        setPayments([]);
      }
    } catch (error) {
      logger.error('Error fetching payments:', error);
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
  const filteredPayments = (Array.isArray(payments) ? payments : []).filter((p) => {
    if (filterMode !== 'all' && p.mode !== filterMode) return false;
    if (filterStatus !== 'all' && p.status !== filterStatus) return false;
    if (filterEmail && !(p.user_email || '').toLowerCase().includes(filterEmail.toLowerCase())) return false;
    if (filterAmountMin && Number(p.amount) < Number(filterAmountMin)) return false;
    if (filterAmountMax && Number(p.amount) > Number(filterAmountMax)) return false;
    if (filterDateFrom && new Date(p.created_at) < new Date(filterDateFrom)) return false;
    if (filterDateTo && new Date(p.created_at) > new Date(filterDateTo)) return false;
    return true;
  });

  // Fonctions pour les actions
  const handleViewPayment = (payment: Payment) => {
    setSelectedPayment(payment);
    setIsViewDialogOpen(true);
  };

  const handleDeletePayment = (payment: Payment) => {
    setPaymentToDelete(payment);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeletePayment = async () => {
    if (!paymentToDelete) return;

    try {
      // Pour les paiements Stripe, on ne peut pas "supprimer" mais on peut rembourser
      if (paymentToDelete.status === 'succeeded') {
        await refundStripePayment(paymentToDelete.payment_intent_id || paymentToDelete.id);
        toast.success('Paiement remboursé avec succès !');
        fetchPayments(); // Recharger la liste
      } else {
        toast.info('Ce paiement ne peut pas être remboursé (statut: ' + paymentToDelete.status + ')');
      }
      setIsDeleteDialogOpen(false);
      setPaymentToDelete(null);
    } catch (error) {
      toast.error('Erreur lors du remboursement: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

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
          <div className="flex gap-2 items-center mt-2 flex-wrap">
            <span>Filtrer par statut :</span>
            <Button variant={filterStatus === 'all' ? 'default' : 'outline'} onClick={() => setFilterStatus('all')}>Tous</Button>
            <Button variant={filterStatus === 'succeeded' ? 'default' : 'outline'} onClick={() => setFilterStatus('succeeded')}>Réussi</Button>
            <Button variant={filterStatus === 'failed' ? 'default' : 'outline'} onClick={() => setFilterStatus('failed')}>Échoué</Button>
            <Button variant={filterStatus === 'processing' ? 'default' : 'outline'} onClick={() => setFilterStatus('processing')}>En cours</Button>
            <Button variant={filterStatus === 'refunded' ? 'default' : 'outline'} onClick={() => setFilterStatus('refunded')}>Remboursé</Button>
            <Button variant={filterStatus === 'pending' ? 'default' : 'outline'} onClick={() => setFilterStatus('pending')}>En attente</Button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 items-end">
          <Input type="text" placeholder="Email client" value={filterEmail} onChange={e => setFilterEmail(e.target.value)} className="w-36" />
          <Input type="number" placeholder="Montant min" value={filterAmountMin} onChange={e => setFilterAmountMin(e.target.value)} className="w-28" />
          <Input type="number" placeholder="Montant max" value={filterAmountMax} onChange={e => setFilterAmountMax(e.target.value)} className="w-28" />
          <Input type="date" placeholder="Date de début" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} className="w-36" />
          <Input type="date" placeholder="Date de fin" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} className="w-36" />
          <Button variant="outline" onClick={fetchPayments} disabled={loading}>
            {loading ? 'Chargement...' : 'Actualiser'}
          </Button>
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
                      <div className="flex items-center gap-2 justify-end">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleViewPayment(payment)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Voir
                        </Button>
                        {payment.status === 'succeeded' && (
                          <Button 
                            variant="destructive" 
                            size="sm" 
                            onClick={() => handleDeletePayment(payment)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Rembourser
                          </Button>
                        )}
                        {payment.invoice_url && (
                          <a href={payment.invoice_url} target="_blank" rel="noopener noreferrer">
                            <Button variant="ghost" size="sm">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </a>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modal de visualisation des détails */}
      {selectedPayment && (
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Détails du paiement</DialogTitle>
              <DialogDescription>
                Informations complètes sur le paiement #{selectedPayment.id?.slice(0, 8)}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="text-sm font-medium">ID:</span>
                <span className="col-span-3 text-sm font-mono">{selectedPayment.id}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="text-sm font-medium">Date:</span>
                <span className="col-span-3 text-sm">{formatDate(selectedPayment.created_at)}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="text-sm font-medium">Client:</span>
                <span className="col-span-3 text-sm">{selectedPayment.booking?.user_name || 'Inconnu'}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="text-sm font-medium">Email:</span>
                <span className="col-span-3 text-sm">{selectedPayment.user_email || 'N/A'}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="text-sm font-medium">Montant:</span>
                <span className="col-span-3 text-sm font-semibold">{selectedPayment.amount} €</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="text-sm font-medium">Devise:</span>
                <span className="col-span-3 text-sm">{selectedPayment.currency || 'EUR'}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="text-sm font-medium">Méthode:</span>
                <span className="col-span-3 text-sm">{selectedPayment.payment_method || 'Carte'}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="text-sm font-medium">Statut:</span>
                <span className="col-span-3 text-sm">
                  {getPaymentStatusBadge(selectedPayment.status)}
                </span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="text-sm font-medium">Mode:</span>
                <span className="col-span-3 text-sm">
                  <Badge color={selectedPayment.mode === 'live' ? 'green' : 'yellow'}>
                    {selectedPayment.mode === 'live' ? 'Production' : 'Test'}
                  </Badge>
                </span>
              </div>
              {selectedPayment.booking && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <span className="text-sm font-medium">Réservation:</span>
                  <span className="col-span-3 text-sm">{selectedPayment.booking.space_name}</span>
                </div>
              )}
              {selectedPayment.description && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <span className="text-sm font-medium">Description:</span>
                  <span className="col-span-3 text-sm">{selectedPayment.description}</span>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button onClick={() => setIsViewDialogOpen(false)}>Fermer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal de confirmation de suppression */}
      {paymentToDelete && (
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmer le remboursement</DialogTitle>
              <DialogDescription>
                Êtes-vous sûr de vouloir rembourser le paiement #{paymentToDelete.id?.slice(0, 8)} ?
                <br />
                <strong>Montant :</strong> {paymentToDelete.amount} €
                <br />
                <strong>Attention :</strong> Cette action est irréversible et remboursera le client.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                Annuler
              </Button>
              <Button variant="destructive" onClick={confirmDeletePayment}>
                Confirmer le remboursement
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default AdminPayments;
