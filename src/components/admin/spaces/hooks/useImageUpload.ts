
import { useState } from "react";
import { toast } from "sonner";

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
      
      // Convertir l'image en base64 pour le stockage
      const base64String = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            resolve(reader.result);
          } else {
            reject(new Error('Erreur lors de la conversion de l\'image'));
          }
        };
        reader.onerror = () => reject(new Error('Erreur lors de la lecture du fichier'));
        reader.readAsDataURL(file);
      });
      
      return base64String;
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
