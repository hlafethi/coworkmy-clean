import { useState } from "react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Trash } from "lucide-react";
import type { Space } from "@/components/admin/types";
import { saveAs } from 'file-saver';

interface SpacesListProps {
  spaces: Space[];
  onEditSpace: (space: Space) => void;
  onSpacesRefresh: () => void;
}

export const SpacesList = ({ spaces, onEditSpace, onSpacesRefresh }: SpacesListProps) => {
  // Add loading state to prevent multiple clicks
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const toggleSpaceStatus = async (id: string, currentStatus: boolean) => {
    try {
      // Set processing state to prevent multiple clicks
      setIsProcessing(id);

      const response = await apiClient.put(`/spaces/${id}`, {
        is_active: !currentStatus
      });

      if (!response.success) {
        throw new Error(response.error || 'Erreur lors de la mise à jour');
      }

      toast.success(`Espace ${currentStatus ? 'désactivé' : 'activé'} avec succès`);

      // Make sure to refresh the list after toggling status
      onSpacesRefresh();
    } catch (error) {
      console.error('Error updating space status:', error);
      toast.error("Impossible de mettre à jour l'espace");
    } finally {
      setIsProcessing(null);
    }
  };

  const deleteSpace = async (id: string) => {
    try {
      setIsProcessing(id);
      
      // D'abord, nettoyer les enregistrements dans stripe_sync_queue
      const { error: cleanupError } = await supabase
        .from('stripe_sync_queue')
        .delete()
        .eq('space_id', id);

      if (cleanupError) {
        console.warn('Erreur lors du nettoyage de la queue Stripe:', cleanupError);
      }

      // Ensuite, supprimer l'espace
      const { error } = await supabase
        .from('spaces')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success("Espace supprimé avec succès");
      onSpacesRefresh();
    } catch (error: any) {
      console.error('Error deleting space:', error);
      
      // Message d'erreur plus spécifique
      if (error?.code === '23502') {
        toast.error("Impossible de supprimer l'espace : contrainte de base de données");
      } else if (error?.code === '23503') {
        toast.error("Impossible de supprimer l'espace : références existantes");
      } else {
        toast.error("Impossible de supprimer l'espace");
      }
    } finally {
      setIsProcessing(null);
    }
  };

  // Function to display price based on pricing type
  const displayPrice = (space: Space) => {
    const pricingType = space.pricing_type ?? 'hourly';
    let priceHT = 0;
    let unit = '';

    switch (pricingType) {
      case 'hourly':
        priceHT = space.hourly_price;
        unit = '/h';
        break;
      case 'daily':
        priceHT = space.daily_price;
        unit = '/jour';
        break;
      case 'half_day':
        priceHT = space.half_day_price || 0;
        unit = '/demi-j';
        break;
      case 'monthly':
        priceHT = space.monthly_price || 0;
        unit = '/mois';
        break;
      case 'quarter':
        priceHT = space.quarter_price || 0;
        unit = '/trim';
        break;
      case 'yearly':
        priceHT = space.yearly_price || 0;
        unit = '/an';
        break;
      case 'custom':
        priceHT = space.custom_price || 0;
        unit = space.custom_label ? ` (${space.custom_label})` : '';
        break;
      default:
        priceHT = space.hourly_price;
        unit = '/h';
    }

    const priceTTC = priceHT * 1.20; // TVA 20%

    return (
      <div className="flex flex-col">
        <span className="text-sm">HT: {priceHT.toLocaleString('fr-FR')} €{unit}</span>
        <span className="text-sm font-medium">TTC: {priceTTC.toLocaleString('fr-FR')} €{unit}</span>
      </div>
    );
  };

  const exportSpacesToStripeCSV = (spaces: Space[]) => {
    const header = [
      'Product Name',
      'Description',
      'Amount',
      'Currency',
      'Interval',
      'Interval Count',
      'Billing Scheme'
    ];
    const rows = spaces.map(space => [
      space.name,
      space.description || '',
      // On prend le prix principal selon le pricing_type
      space.pricing_type === 'hourly' ? space.hourly_price :
        space.pricing_type === 'daily' ? space.daily_price :
          space.pricing_type === 'half_day' ? space.half_day_price :
            space.pricing_type === 'monthly' ? space.monthly_price :
              space.pricing_type === 'quarter' ? space.quarter_price :
                space.pricing_type === 'yearly' ? space.yearly_price :
                  space.custom_price || 0,
      'eur',
      // Interval Stripe
      space.pricing_type === 'hourly' ? 'day' :
        space.pricing_type === 'daily' ? 'day' :
          space.pricing_type === 'half_day' ? 'day' :
            space.pricing_type === 'monthly' ? 'month' :
              space.pricing_type === 'quarter' ? 'quarter' :
                space.pricing_type === 'yearly' ? 'year' :
                  'day',
      1,
      'per_unit'
    ]);
    const csv = [header, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'export-stripe-espaces.csv');
  };

  return (
    <>
      <div className="flex justify-end mb-4 gap-2">
        <button
          className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
          onClick={() => exportSpacesToStripeCSV(spaces)}
        >
          Exporter CSV Stripe
        </button>
        <button
          className="px-4 py-2 bg-green-700 text-white rounded hover:bg-green-800 disabled:opacity-60"
          disabled={isProcessing === 'stripe-sync'}
          onClick={async () => {
            setIsProcessing('stripe-sync');
            try {
              // Ajouter tous les espaces à la file d'attente de synchronisation
              const syncJobs = spaces.map(space => ({
                space_id: space.id,
                event_type: 'MANUAL_SYNC',
                payload: {
                  space_id: space.id,
                  space_name: space.name,
                  pricing_type: space.pricing_type,
                  manual_sync: true
                },
                status: 'pending'
              }));

              const { error: queueError } = await supabase
                .from('stripe_sync_queue')
                .upsert(syncJobs, { onConflict: ['space_id', 'event_type'] });

              if (queueError) throw new Error(queueError.message);

              // Récupérer le token JWT de l'utilisateur connecté
              const { data: { session }, error: sessionError } = await supabase.auth.getSession();
              if (sessionError || !session?.access_token) {
                throw new Error('Session utilisateur non disponible');
              }

              // Déclencher la synchronisation via la fonction Edge
              const response = await fetch(
                `https://exffryodynkyizbeesbt.functions.supabase.co/stripe-sync-queue`,
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                  }
                }
              );
              
              if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Erreur HTTP ${response.status}: ${errorText}`);
              }
              
              toast.success('Synchronisation Stripe lancée pour tous les espaces !');
              onSpacesRefresh();
            } catch (err: any) {
              toast.error(err.message || 'Erreur lors de la synchronisation Stripe');
            } finally {
              setIsProcessing(null);
            }
          }}
        >
          {isProcessing === 'stripe-sync' ? 'Synchronisation…' : 'Tout synchroniser'}
        </button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nom</TableHead>
            <TableHead>Capacité</TableHead>
            <TableHead>Tarification</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {spaces.map((space) => (
            <TableRow key={space.id}>
              <TableCell className="font-medium">{space.name}</TableCell>
              <TableCell>{space.capacity} personnes</TableCell>
              <TableCell>{displayPrice(space)}</TableCell>
              <TableCell>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium border ${space.is_active
                    ? 'bg-green-50 text-green-700 border-green-200'
                    : 'bg-red-50 text-red-700 border-red-200'
                    }`}
                >
                  {space.is_active ? 'Actif' : 'Inactif'}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEditSpace(space)}
                    disabled={isProcessing === space.id}
                  >
                    <Edit size={16} />
                  </Button>
                  <Button
                    variant={space.is_active ? "destructive" : "default"}
                    size="sm"
                    onClick={() => toggleSpaceStatus(space.id, space.is_active)}
                    disabled={isProcessing === space.id}
                  >
                    {isProcessing === space.id ? (
                      "En cours..."
                    ) : space.is_active ? (
                      <Trash size={16} />
                    ) : (
                      "Activer"
                    )}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteSpace(space.id)}
                    disabled={isProcessing === space.id}
                    title="Supprimer l'espace"
                  >
                    Supprimer
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
};
