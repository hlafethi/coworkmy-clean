import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Plus } from "lucide-react";
// import { supabase } from "@/integrations/supabase/client"; // Désactivé - utilisation de PostgreSQL
import { toast } from "sonner";

interface ImageUploadFormProps {
  onImageUploaded: (imageUrl: string) => Promise<void>;
}

export function ImageUploadForm({ onImageUploaded }: ImageUploadFormProps) {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);

  // 🔧 Fonction pour créer un nouveau fichier avec le bon type MIME
  const createImageFile = (originalFile: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        
        // Déterminer le type MIME basé sur l'extension
        const extension = originalFile.name.split('.').pop()?.toLowerCase();
        let mimeType = 'image/jpeg'; // défaut
        
        switch (extension) {
          case 'png':
            mimeType = 'image/png';
            break;
          case 'jpg':
          case 'jpeg':
            mimeType = 'image/jpeg';
            break;
          case 'webp':
            mimeType = 'image/webp';
            break;
          case 'gif':
            mimeType = 'image/gif';
            break;
        }
        
        console.log('🔄 Reconstruction du fichier carrousel:', {
          originalName: originalFile.name,
          originalType: originalFile.type,
          newType: mimeType,
          size: arrayBuffer.byteLength
        });
        
        // Créer un nouveau fichier avec le bon type MIME
        const newFile = new File([arrayBuffer], originalFile.name, {
          type: mimeType,
          lastModified: Date.now()
        });
        
        resolve(newFile);
      };
      
      reader.onerror = () => reject(new Error('Erreur lecture fichier'));
      reader.readAsArrayBuffer(originalFile);
    });
  };

  // 🔧 Upload avec le même système que ImageUploader
  const uploadImage = async (file: File): Promise<string> => {
    try {
      console.log('📁 Upload carrousel - Fichier original:', {
        name: file.name,
        size: file.size,
        type: file.type
      });
      
      // Reconstruire le fichier avec le bon type MIME
      const reconstructedFile = await createImageFile(file);
      
      console.log('📁 Upload carrousel - Fichier reconstruit:', {
        name: reconstructedFile.name,
        size: reconstructedFile.size,
        type: reconstructedFile.type
      });
      
      // Solution alternative : convertir l'image en base64
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          if (result) {
            console.log('🔗 URL carrousel générée (base64):', result.substring(0, 50) + '...');
            resolve(result);
          } else {
            reject(new Error('Impossible de lire le fichier'));
          }
        };
        reader.onerror = () => {
          reject(new Error('Erreur lors de la lecture du fichier'));
        };
        reader.readAsDataURL(reconstructedFile);
      });
    } catch (error) {
      console.error('❌ Erreur upload carrousel complète:', error);
      throw error;
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log('🔍 Fichier carrousel sélectionné:', file);
      
      // Vérifications
      const extension = file.name.split('.').pop()?.toLowerCase();
      const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
      
      if (!allowedExtensions.includes(extension || '')) {
        toast.error("Extension de fichier non supportée");
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        toast.error("L'image doit faire moins de 5MB");
        return;
      }

      setSelectedImage(file);
      
      // Créer un aperçu
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddImage = async () => {
    if (!selectedImage) return;
    
    try {
      setIsUploading(true);
      const imageUrl = await uploadImage(selectedImage);
      await onImageUploaded(imageUrl);
      
      // Reset le formulaire
      setSelectedImage(null);
      setImagePreview("");
      
      // Reset l'input file
      const fileInput = document.getElementById('carousel-image-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
      toast.success("Image ajoutée au carrousel !");
    } catch (error) {
      console.error('❌ Erreur ajout image carrousel:', error);
      toast.error("Erreur lors de l'ajout de l'image");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <input
          type="file"
          accept=".jpg,.jpeg,.png,.webp,.gif"
          onChange={handleImageChange}
          className="hidden"
          id="carousel-image-upload"
        />
        <label
          htmlFor="carousel-image-upload"
          className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-md"
        >
          <Plus className="h-4 w-4" />
          Sélectionner une image
        </label>
        {imagePreview && (
          <Button 
            onClick={handleAddImage} 
            disabled={isUploading}
          >
            {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Ajouter au carrousel
          </Button>
        )}
      </div>

      {imagePreview && (
        <div className="mt-4">
          <img src={imagePreview} alt="Aperçu" className="max-w-xs rounded-md" />
        </div>
      )}
    </div>
  );
}
