import React, { useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Camera, Upload, Loader2, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

interface LogoUploadProps {
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

export const LogoUpload: React.FC<LogoUploadProps> = ({
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
      // Créer un aperçu local immédiatement
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
      
      // Notifier immédiatement le parent avec l'URL de preview
      onLogoUpdated(objectUrl);

      // Créer un client Supabase propre pour l'upload
      const storageClient = createStorageClient();

      // Générer un nom de fichier unique qui commence par l'ID de l'utilisateur
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}_${Date.now()}.${fileExt}`;

      // Upload avec gestion explicite du Content-Type
      const { data: uploadData, error: uploadError } = await storageClient.storage
        .from('logos')
        .upload(fileName, file, {
          contentType: file.type,
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      // Obtenir l'URL publique
      const { data: { publicUrl } } = storageClient.storage
        .from('logos')
        .getPublicUrl(uploadData.path);

      // Mettre à jour le profil dans la base de données
      const result = await apiClient.put(`/users/${userId}`, { 
        logo_url: publicUrl,
        updated_at: new Date().toISOString()
      });

      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de la mise à jour');
      }

      // Notifier le parent avec l'URL publique finale
      onLogoUpdated(publicUrl);
      toast.success('Logo d\'entreprise mis à jour');

      // Nettoyer l'aperçu
      URL.revokeObjectURL(objectUrl);
      setPreviewUrl(null);

    } catch (error: any) {
      console.error("Erreur lors de l'upload du logo:", error);
      
      // Gestion d'erreur améliorée
      if (error?.statusCode === 415) {
        toast.error('Erreur de format : Vérifiez le type de fichier');
      } else if (error?.message?.includes('size')) {
        toast.error('Fichier trop volumineux. Maximum 5MB.');
      } else if (error?.message?.includes('policy')) {
        toast.error('Erreur de permissions. Vérifiez la configuration des buckets.');
      } else {
        toast.error(`Erreur technique : ${error?.message || 'Erreur inconnue'}`);
      }
      
      // Nettoyer l'aperçu en cas d'erreur
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={`flex flex-col items-center space-y-4 ${className}`}>
      {/* Logo avec overlay pour l'upload */}
      <div className="relative group">
        <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors">
          {previewUrl || currentLogoUrl ? (
            <img 
              src={previewUrl || currentLogoUrl} 
              alt="Logo de l'entreprise"
              className="max-w-full max-h-full object-contain p-2"
              onError={(e) => {
                console.warn('Erreur de chargement du logo:', e);
                e.currentTarget.style.display = 'none';
                // Afficher l'icône par défaut
                const fallback = e.currentTarget.nextElementSibling;
                if (fallback) {
                  fallback.classList.remove('hidden');
                }
              }}
            />
          ) : null}
          
          {!previewUrl && !currentLogoUrl && (
            <Building2 className="h-12 w-12 text-gray-400" />
          )}
        </div>

        {/* Overlay pour l'upload */}
        <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
          <Camera className="h-6 w-6 text-white" />
        </div>

        {/* Input file caché */}
        <input
          type="file"
          accept={ALLOWED_MIME_TYPES.join(',')}
          onChange={handleFileSelect}
          disabled={uploading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />

        {/* Indicateur de chargement */}
        {uploading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
            <Loader2 className="h-6 w-6 text-white animate-spin" />
          </div>
        )}
      </div>

      {/* Bouton d'upload alternatif */}
      <div className="text-center">
        <Button
          variant="outline"
          size="sm"
          disabled={uploading}
          onClick={() => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = ALLOWED_MIME_TYPES.join(',');
            input.onchange = (e) => handleFileSelect(e as any);
            input.click();
          }}
          className="flex items-center gap-2"
        >
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Upload en cours...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              {currentLogoUrl ? 'Changer le logo' : 'Ajouter un logo'}
            </>
          )}
        </Button>
        
        <p className="text-xs text-gray-500 mt-2">
          JPG, PNG, WebP ou SVG • Max 5MB
        </p>
      </div>
    </div>
  );
};

export default LogoUpload; 