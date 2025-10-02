import React, { useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, Upload, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface AvatarUploadSimpleProps {
  currentAvatarUrl?: string;
  userId: string;
  onAvatarUpdated: (newAvatarUrl: string) => void;
  className?: string;
}

// Types MIME autorisés
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp'
];

export const AvatarUploadSimple: React.FC<AvatarUploadSimpleProps> = ({
  currentAvatarUrl,
  userId,
  onAvatarUpdated,
  className = ''
}) => {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const validateFile = (file: File): boolean => {
    // Vérification du type MIME
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      toast.error('Type de fichier non supporté. Utilisez JPG, PNG ou WebP.');
      return false;
    }

    // Vérification de la taille
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error('L\'image ne doit pas dépasser 5MB');
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
        onAvatarUpdated(dataUrl);

        try {
          // Mettre à jour le profil dans la base de données avec l'API client
          const result = await apiClient.put(`/users/${userId}`, { 
            avatar_url: dataUrl,
            updated_at: new Date().toISOString()
          });

          console.log('Résultat update:', result);

          if (!result.success) {
            throw new Error(result.error || 'Erreur lors de la mise à jour');
          }

          // Notifier le parent avec l'URL finale
          onAvatarUpdated(dataUrl);
          toast.success('Photo de profil mise à jour');

        } catch (error: any) {
          console.error("Erreur technique :", error);
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
      console.error("Erreur technique :", error);
      toast.error(`Erreur technique : ${error?.message || 'Erreur inconnue'}`);
      setUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    setUploading(true);
    
    try {
      const result = await apiClient.put(`/users/${userId}`, { 
        avatar_url: null,
        updated_at: new Date().toISOString()
      });

      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de la suppression');
      }

      onAvatarUpdated('');
      setPreviewUrl(null);
      toast.success('Photo de profil supprimée');
    } catch (error: any) {
      console.error("Erreur suppression :", error);
      toast.error(`Erreur : ${error?.message || 'Erreur inconnue'}`);
    } finally {
      setUploading(false);
    }
  };

  const displayUrl = previewUrl || currentAvatarUrl;

  return (
    <div className={`flex flex-col items-center space-y-4 ${className}`}>
      <div className="relative">
        <Avatar className="w-24 h-24">
          <AvatarImage 
            src={displayUrl || undefined} 
            alt="Avatar" 
            className="object-cover"
          />
          <AvatarFallback className="text-lg">
            {currentAvatarUrl ? '👤' : '📷'}
          </AvatarFallback>
        </Avatar>
        
        {uploading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
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
            onClick={() => document.getElementById('avatar-upload')?.click()}
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Camera className="h-4 w-4" />
            )}
            <span>{uploading ? 'Upload...' : 'Changer'}</span>
          </Button>
          
          <input
            id="avatar-upload"
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            disabled={uploading}
          />
          
          {currentAvatarUrl && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRemoveAvatar}
              disabled={uploading}
              className="text-red-600 hover:text-red-700"
            >
              Supprimer
            </Button>
          )}
        </div>
        
        <p className="text-xs text-gray-500 text-center">
          JPG, PNG, WebP • Max 5MB
        </p>
      </div>
    </div>
  );
};
