import React, { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Trash, Users, Clock, Tag, Check, X, RefreshCw } from "lucide-react";
import type { Space } from "@/components/admin/types";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

interface SpaceCardProps {
  space: Space;
  onEdit: (space: Space) => void;
  onToggleStatus: (id: string, currentStatus: boolean) => void;
  onDelete: (id: string) => void;
  isProcessing: boolean;
}

export const SpaceCard: React.FC<SpaceCardProps> = ({
  space,
  onEdit,
  onToggleStatus,
  onDelete,
  isProcessing
}) => {
  const [syncing, setSyncing] = useState(false);

  // Fonction de synchronisation manuelle
  const handleSync = async () => {
    setSyncing(true);
    try {
      // Ajouter l'espace à la file d'attente de synchronisation
      const { error: queueError } = await supabase
        .from('stripe_sync_queue')
        .upsert({
          space_id: space.id,
          event_type: 'MANUAL_SYNC',
          payload: {
            space_id: space.id,
            space_name: space.name,
            pricing_type: space.pricing_type,
            manual_sync: true
          },
          status: 'pending'
        }, { onConflict: ['space_id', 'event_type'] });

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
      
      toast.success("Synchronisation Stripe lancée !");
    } catch (e: any) {
      toast.error("Erreur lors de la synchronisation Stripe : " + e.message);
    } finally {
      setSyncing(false);
    }
  };

  // Function to display price based on pricing type
  const displayPrice = () => {
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

  // Function to get pricing type label
  const getPricingTypeLabel = () => {
    switch (space.pricing_type) {
      case 'hourly': return 'Horaire';
      case 'daily': return 'Journalier';
      case 'half_day': return 'Demi-journée';
      case 'monthly': return 'Mensuel';
      case 'quarter': return 'Trimestriel';
      case 'yearly': return 'Annuel';
      case 'custom': return space.custom_label || 'Personnalisé';
      default: return 'Horaire';
    }
  };

  return (
    <Card className={`overflow-hidden ${!space.is_active ? 'opacity-70' : ''}`}>
      {space.image_url ? (
        <div className="h-40 overflow-hidden">
          <img 
            src={space.image_url} 
            alt={space.name} 
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="h-40 bg-gray-50 flex items-center justify-center">
          <span className="text-gray-500">Aucune image</span>
        </div>
      )}
      
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{space.name}</CardTitle>
          <Badge variant={space.is_active ? "default" : "destructive"} className={space.is_active ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}>
            {space.is_active ? 'Actif' : 'Inactif'}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3 pb-2">
        {space.description && (
          <p className="text-sm text-gray-600 line-clamp-2">{space.description}</p>
        )}
        
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-1 text-sm">
            <Users className="h-4 w-4 text-gray-500" />
            <span>{space.capacity} personnes</span>
          </div>
          
          <div className="flex items-center gap-1 text-sm">
            <Clock className="h-4 w-4 text-gray-500" />
            <span>{getPricingTypeLabel()}</span>
          </div>
        </div>
        
        <div className="pt-2 border-t">
          <div className="flex items-center gap-1">
            <Tag className="h-4 w-4 text-gray-500" />
            {displayPrice()}
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="pt-2 flex justify-between">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => onEdit(space)}
          disabled={isProcessing}
        >
          <Edit className="h-4 w-4 mr-1" />
          Modifier
        </Button>
        
        <div className="flex gap-2">
          <Button 
            variant={space.is_active ? "destructive" : "default"} 
            size="sm"
            onClick={() => onToggleStatus(space.id, space.is_active)}
            disabled={isProcessing}
          >
            {isProcessing ? (
              "En cours..."
            ) : space.is_active ? (
              <>
                <X className="h-4 w-4 mr-1" />
                Désactiver
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-1" />
                Activer
              </>
            )}
          </Button>
          
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDelete(space.id)}
            disabled={isProcessing}
            title="Supprimer l'espace"
          >
            <Trash className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleSync}
            disabled={syncing}
            title="Synchroniser avec Stripe"
          >
            {syncing ? (
              <RefreshCw className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-1" />
            )}
            Sync Stripe
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};
