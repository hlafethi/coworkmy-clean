
import { useState } from "react";
import { toast } from "sonner";
// Logger supprimé - utilisation de console directement
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
      
      // Compresser l'image avant de la convertir en base64
      const compressedFile = await compressImage(file);
      
      // Convertir l'image compressée en base64 pour le stockage
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
        reader.readAsDataURL(compressedFile);
      });
      
      // Mettre à jour l'aperçu avec l'image base64
      setImagePreview(base64String);
      
      return base64String;
    } catch (error) {
      console.error('Erreur lors de l\'upload de l\'image:', error);
      toast.error("Impossible d'uploader l'image");
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  // Fonction pour compresser l'image
  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Définir les dimensions maximales
        const maxWidth = 800;
        const maxHeight = 600;
        
        let { width, height } = img;
        
        // Calculer les nouvelles dimensions en gardant le ratio
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Dessiner l'image redimensionnée
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Convertir en blob avec compression
        canvas.toBlob((blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          } else {
            resolve(file);
          }
        }, 'image/jpeg', 0.8); // Qualité 80%
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  return {
    selectedImage,
    imagePreview,
    isUploading,
    handleImageChange,
    uploadImage
  };
};
