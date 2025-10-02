import React, { useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Camera, Upload, Loader2, Building2 } from 'lucide-react';
import { toast } from 'sonner';

interface LogoUploadSimpleProps {
  currentLogoUrl?: string;
  userId: string;
  onLogoUpdated: (newLogoUrl: string) => void;
  className?: string;
}

// Types MIME autorisés
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/svg+xml'
];

export const LogoUploadSimple: React.FC<LogoUploadSimpleProps> = ({
  currentLogoUrl,
  userId,
  onLogoUpdated,
  className = ''
}) => {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const validateFile = (file: File): boolean => {
    // Vérification du type MIME
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      toast.error('Type de fichier non supporté. Utilisez JPG, PNG, WebP ou SVG.');
      return false;
    }

    // Vérification de la taille
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error('Le logo ne doit pas dépasser 5MB');
      return false;
    }

    return true;
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!validateFile(file)) {
      return;
    }

    setUploading(true);

    try {
      // Convertir le fichier en data URL
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        const dataUrl = e.target?.result as string;
        if (!dataUrl) return;

        // Créer un aperçu local immédiatement
        setPreviewUrl(dataUrl);
        
        // Notifier immédiatement le parent avec l'URL de preview
        onLogoUpdated(dataUrl);

        try {
          // Mettre à jour le profil dans la base de données avec l'API client
          const result = await apiClient.put(`/users/${userId}`, { 
            logo_url: dataUrl,
            updated_at: new Date().toISOString()
          });

          console.log('Résultat update logo:', result);

          if (!result.success) {
            throw new Error(result.error || 'Erreur lors de la mise à jour');
          }

          // Notifier le parent avec l'URL finale
          onLogoUpdated(dataUrl);
          toast.success('Logo mis à jour');

        } catch (error: any) {
          console.error("Erreur technique logo :", error);
          toast.error(`Erreur technique : ${error?.message || 'Erreur inconnue'}`);
          
          // Nettoyer l'aperçu en cas d'erreur
          if (previewUrl) {
            setPreviewUrl(null);
          }
        } finally {
          setUploading(false);
        }
      };

      reader.onerror = () => {
        toast.error('Erreur lors de la lecture du fichier');
        setUploading(false);
      };

      reader.readAsDataURL(file);

    } catch (error: any) {
      console.error("Erreur technique logo :", error);
      toast.error(`Erreur technique : ${error?.message || 'Erreur inconnue'}`);
      setUploading(false);
    }
  };

  const handleRemoveLogo = async () => {
    setUploading(true);
    
    try {
      const result = await apiClient.put(`/users/${userId}`, { 
        logo_url: null,
        updated_at: new Date().toISOString()
      });

      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de la suppression');
      }

      onLogoUpdated('');
      setPreviewUrl(null);
      toast.success('Logo supprimé');
    } catch (error: any) {
      console.error("Erreur suppression logo :", error);
      toast.error(`Erreur : ${error?.message || 'Erreur inconnue'}`);
    } finally {
      setUploading(false);
    }
  };

  const displayUrl = previewUrl || currentLogoUrl;

  return (
    <div className={`flex flex-col items-center space-y-4 ${className}`}>
      <div className="relative">
        <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
          {displayUrl ? (
            <img 
              src={displayUrl} 
              alt="Logo" 
              className="w-full h-full object-contain rounded-lg"
            />
          ) : (
            <Building2 className="w-8 h-8 text-gray-400" />
          )}
        </div>
        
        {uploading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-white" />
          </div>
        )}
      </div>

      <div className="flex flex-col space-y-2">
        <div className="flex space-x-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading}
            className="flex items-center space-x-2"
            onClick={() => document.getElementById('logo-upload')?.click()}
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Camera className="h-4 w-4" />
            )}
            <span>{uploading ? 'Upload...' : 'Changer'}</span>
          </Button>
          
          <input
            id="logo-upload"
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            disabled={uploading}
          />
          
          {currentLogoUrl && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRemoveLogo}
              disabled={uploading}
              className="text-red-600 hover:text-red-700"
            >
              Supprimer
            </Button>
          )}
        </div>
        
        <p className="text-xs text-gray-500 text-center">
          JPG, PNG, WebP, SVG • Max 5MB
        </p>
      </div>
    </div>
  );
};
