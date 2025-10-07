import { useState } from "react";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import { ImageUploadForm } from "./carousel/ImageUploadForm";
import { CarouselImageList } from "./carousel/CarouselImageList";
import { useQuery, useQueryClient } from "@tanstack/react-query";
// Logger supprimé - utilisation de console directement
interface CarouselImage {
  id: string;
  image_url: string;
  display_order: number;
}

export function CarouselImageManager() {
  const queryClient = useQueryClient();

  // Utiliser React Query pour gérer les images
  const { data: images = [], isLoading, refetch } = useQuery({
    queryKey: ["carousel-images"],
    queryFn: async () => {
      console.log('🔄 Chargement des images du carrousel...');
      const result = await apiClient.get('/carousel-images');
      
      if (result.success && result.data) {
        console.log('✅ Images chargées:', result.data.length);
        return result.data;
      } else {
        console.log('📝 Aucune image trouvée, utilisation d\'une liste vide');
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const handleAddImage = async (imageUrl: string) => {
    try {
      console.log('🔄 Ajout d\'une nouvelle image:', imageUrl);
      
      const result = await apiClient.post('/carousel-images', {
        image_url: imageUrl,
        display_order: images.length
      });

      if (result.success) {
        console.log('✅ Image ajoutée à la DB');
        
        toast.success("Image ajoutée avec succès");
        
        // Invalider et recharger automatiquement
        await queryClient.invalidateQueries({ queryKey: ["carousel-images"] });
        console.log('✅ Cache React Query invalidé');
      } else {
        throw new Error(result.error || 'Erreur lors de l\'ajout');
      }
    } catch (error) {
      console.error('❌ Erreur lors de l\'ajout de l\'image:', error);
      toast.error("Impossible d'ajouter l'image");
    }
  };

  const handleDeleteImage = async (id: string) => {
    try {
      console.log('🗑️ Suppression de l\'image:', id);
      
      const result = await apiClient.delete(`/carousel-images/${id}`);

      if (result.success) {
        console.log('✅ Image supprimée de la DB');
        
        toast.success("Image supprimée avec succès");
        
        // Invalider et recharger automatiquement
        await queryClient.invalidateQueries({ queryKey: ["carousel-images"] });
        console.log('✅ Cache React Query invalidé');
      } else {
        throw new Error(result.error || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('❌ Erreur lors de la suppression:', error);
      toast.error("Impossible de supprimer l'image");
    }
  };

  const handleReorder = async (id: string, direction: 'up' | 'down') => {
    const currentIndex = images.findIndex(img => img.id === id);
    if (
      (direction === 'up' && currentIndex === 0) ||
      (direction === 'down' && currentIndex === images.length - 1)
    ) return;

    const newImages = [...images];
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    try {
      console.log('🔄 Réorganisation des images...');
      
      const [movedImage] = newImages.splice(currentIndex, 1);
      newImages.splice(targetIndex, 0, movedImage);
      
      // Update display order for all images with their image_url
      const updates = newImages.map((img, index) => ({
        id: img.id,
        display_order: index,
        image_url: img.image_url // Include image_url in the update
      }));

      // Utiliser l'API client au lieu de Supabase
      const result = await apiClient.put('/carousel-images/reorder', { images: updates });
      
      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de la mise à jour');
      }
      
      console.log('✅ Ordre mis à jour dans la DB');
      
      // Invalider et recharger automatiquement
      await queryClient.invalidateQueries({ queryKey: ["carousel-images"] });
      console.log('✅ Cache React Query invalidé');
    } catch (error) {
      console.error('❌ Erreur lors de la réorganisation:', error);
      toast.error("Impossible de réorganiser les images");
    }
  };

  if (isLoading) {
    return <div>Chargement des images...</div>;
  }

  return (
    <div className="space-y-6">
      <ImageUploadForm onImageUploaded={handleAddImage} />
      <CarouselImageList 
        images={images}
        onReorder={handleReorder}
        onDelete={handleDeleteImage}
      />
    </div>
  );
}
