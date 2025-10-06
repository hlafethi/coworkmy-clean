import { Button } from "@/components/ui/button";
import { Plus, RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { supabaseAdmin } from "@/lib/supabase";
import { logger } from '@/utils/logger';

interface SpacesHeaderProps {
  onAddSpace: () => void;
}

export const SpacesHeader = ({ onAddSpace }: SpacesHeaderProps) => {
  const [syncingAll, setSyncingAll] = useState(false);

  const handleSyncAll = async () => {
    setSyncingAll(true);
    try {
      // Utiliser le client Supabase avec la clé service_role
      const { data, error } = await supabaseAdmin.functions.invoke('stripe-sync-queue', {
        body: { 
          action: 'sync_all',
          timestamp: new Date().toISOString()
        }
      });
      
      if (error) {
        logger.error('Erreur Supabase:', error);
        throw new Error(`Erreur Supabase: ${error.message}`);
      }
      
      logger.debug('Résultat synchronisation:', data);
      toast.success("Synchronisation Stripe de tous les espaces lancée !");
    } catch (e: any) {
      logger.error('Erreur complète:', e);
      toast.error("Erreur lors de la synchronisation globale Stripe : " + e.message);
    } finally {
      setSyncingAll(false);
    }
  };

  return (
    <div className="flex justify-between items-center">
      <h2 className="text-2xl font-bold">Gestion des espaces</h2>
      <div className="flex gap-2">
        <Button 
          className="flex items-center gap-2"
          onClick={handleSyncAll}
          disabled={syncingAll}
          variant="secondary"
        >
          {syncingAll ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          <span>Tout synchroniser</span>
        </Button>
        <Button 
          className="flex items-center gap-2"
          onClick={onAddSpace}
        >
          <Plus size={16} />
          <span>Ajouter un espace</span>
        </Button>
      </div>
    </div>
  );
};
