import React, { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Trash, Users, Clock, Tag, Check, X, RefreshCw, Loader2 } from "lucide-react";
import type { Space } from "@/components/admin/types";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
// Logger supprimé - utilisation de console directement
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
      // Synchronisation via l'API
      const response = await apiClient.get(`/spaces/${space.id}`);
      
      if (!response.success) {
        throw new Error(response.error || 'Erreur lors de la récupération de l\'espace');
      }

      toast.success(`Synchronisation réussie pour "${space.name}"`);
    } catch (e: any) {
      toast.error("Erreur lors de la synchronisation : " + e.message);
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
            onError={(e) => {
              console.error('Erreur chargement image:', space.name, space.image_url?.substring(0, 100));
              e.currentTarget.style.display = 'none';
            }}
            onLoad={() => {
            }}
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
      
      <CardFooter className="pt-2 flex justify-between gap-1">
        <Button 
          variant="outline" 
          size="sm"
          className="flex-1 text-xs px-2"
          onClick={() => onEdit(space)}
          disabled={isProcessing}
        >
          <Edit className="h-3 w-3 mr-1" />
          Modifier
        </Button>
        
        <div className="flex gap-1">
          <Button 
            variant={space.is_active ? "destructive" : "default"} 
            size="sm"
            className="text-xs px-2"
            onClick={() => onToggleStatus(space.id, space.is_active)}
            disabled={isProcessing}
            title={space.is_active ? "Désactiver l'espace" : "Activer l'espace"}
          >
            {isProcessing ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : space.is_active ? (
              <X className="h-3 w-3" />
            ) : (
              <Check className="h-3 w-3" />
            )}
          </Button>
          
          <Button
            variant="destructive"
            size="sm"
            className="text-xs px-2"
            onClick={() => onDelete(space.id)}
            disabled={isProcessing}
            title="Supprimer l'espace"
          >
            <Trash className="h-3 w-3" />
          </Button>
          
          <Button
            variant="secondary"
            size="sm"
            className="text-xs px-2"
            onClick={handleSync}
            disabled={syncing}
            title="Synchroniser avec Stripe"
          >
            {syncing ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <RefreshCw className="h-3 w-3" />
            )}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};
