import React, { useState } from "react";
import { SpaceCard } from "./SpaceCard";
import { Skeleton } from "@/components/ui/skeleton";
import type { Space } from "@/components/admin/types";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";

interface SpaceGridProps {
  spaces: Space[];
  loading: boolean;
  onEditSpace: (space: Space) => void;
  onSpacesRefresh: () => void;
}

export const SpaceGrid: React.FC<SpaceGridProps> = ({
  spaces,
  loading,
  onEditSpace,
  onSpacesRefresh
}) => {
  // Add loading state to prevent multiple clicks
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const toggleSpaceStatus = async (id: string, currentStatus: boolean) => {
    try {
      // Set processing state to prevent multiple clicks
      setIsProcessing(id);
      
      const { error } = await supabase
        .from('spaces')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      
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
      
      // Supprimer l'espace via l'API
      const response = await apiClient.delete(`/spaces/${id}`);
      
      if (!response.success) {
        throw new Error(response.error || "Erreur lors de la suppression");
      }

      toast.success("Espace supprimé avec succès");
      onSpacesRefresh();
    } catch (error: any) {
      console.error('Error deleting space:', error);
      
      // Message d'erreur plus spécifique
      if (error?.message?.includes('contrainte')) {
        toast.error("Impossible de supprimer l'espace : contrainte de base de données");
      } else if (error?.message?.includes('références')) {
        toast.error("Impossible de supprimer l'espace : références existantes");
      } else {
        toast.error("Impossible de supprimer l'espace");
      }
    } finally {
      setIsProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (spaces.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Aucun espace trouvé
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {spaces.map((space) => (
        <SpaceCard
          key={space.id}
          space={space}
          onEdit={onEditSpace}
          onToggleStatus={toggleSpaceStatus}
          onDelete={deleteSpace}
          isProcessing={isProcessing === space.id}
        />
      ))}
    </div>
  );
};
