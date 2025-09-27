
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const useImageUpload = (initialImageUrl: string | null = null) => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(initialImageUrl);
  const [isUploading, setIsUploading] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("L'image ne doit pas dépasser 5MB");
      return;
    }

    setSelectedImage(file);
    const objectUrl = URL.createObjectURL(file);
    setImagePreview(objectUrl);
  };

  const uploadImage = async (file: File): Promise<string> => {
    try {
      setIsUploading(true);
      const fileExt = file.name.split('.').pop();
      // Générer un identifiant unique sans dépendance externe
      const uniqueId = crypto.randomUUID();
      const fileName = `${uniqueId}.${fileExt}`;
      const filePath = `spaces/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('spaces')
        .upload(filePath, file);
        
      if (uploadError) throw uploadError;
      
      const { data } = supabase.storage
        .from('spaces')
        .getPublicUrl(filePath);
        
      return data.publicUrl;
    } catch (error) {
      console.error('Erreur lors de l\'upload de l\'image:', error);
      toast.error("Impossible d'uploader l'image");
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  return {
    selectedImage,
    imagePreview,
    isUploading,
    handleImageChange,
    uploadImage
  };
};
