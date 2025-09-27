import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ImageUploadForm } from "./carousel/ImageUploadForm";
import { CarouselImageList } from "./carousel/CarouselImageList";
import { useQueryClient } from "@tanstack/react-query";

interface CarouselImage {
  id: string;
  image_url: string;
  display_order: number;
}

export function CarouselImageManager() {
  const [images, setImages] = useState<CarouselImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    loadCarouselImages();
  }, []);

  const loadCarouselImages = async () => {
    try {
      console.log('🔄 Chargement des images du carrousel...');
      
      const { data, error } = await supabase
        .from('carousel_images')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      
      console.log('✅ Images chargées:', data?.length || 0);
      setImages(data || []);
    } catch (error) {
      console.error('❌ Erreur lors du chargement des images:', error);
      toast.error("Impossible de charger les images du carrousel");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddImage = async (imageUrl: string) => {
    try {
      console.log('🔄 Ajout d\'une nouvelle image:', imageUrl);
      
      const { error } = await supabase
        .from('carousel_images')
        .insert({
          image_url: imageUrl,
          display_order: images.length
        });

      if (error) throw error;
      
      console.log('✅ Image ajoutée à la DB');
      
      // 🔧 CORRECTION : Invalider le cache React Query
      await queryClient.invalidateQueries({ 
        queryKey: ["carousel-images"] 
      });
      
      console.log('✅ Cache React Query invalidé');
      
      toast.success("Image ajoutée avec succès");
      loadCarouselImages();
    } catch (error) {
      console.error('❌ Erreur lors de l\'ajout de l\'image:', error);
      toast.error("Impossible d'ajouter l'image");
    }
  };

  const handleDeleteImage = async (id: string) => {
    try {
      console.log('🗑️ Suppression de l\'image:', id);
      
      const { error } = await supabase
        .from('carousel_images')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      console.log('✅ Image supprimée de la DB');
      
      // 🔧 CORRECTION : Invalider le cache React Query
      await queryClient.invalidateQueries({ 
        queryKey: ["carousel-images"] 
      });
      
      console.log('✅ Cache React Query invalidé');
      
      toast.success("Image supprimée avec succès");
      loadCarouselImages();
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

      const { error } = await supabase
        .from('carousel_images')
        .upsert(updates);

      if (error) throw error;
      
      console.log('✅ Ordre mis à jour dans la DB');
      
      // 🔧 CORRECTION : Invalider le cache React Query
      await queryClient.invalidateQueries({ 
        queryKey: ["carousel-images"] 
      });
      
      console.log('✅ Cache React Query invalidé');
      
      loadCarouselImages();
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
