import React, { useState } from 'react';
import { createStorageClient, supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, Upload, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

interface AvatarUploadProps {
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

export const AvatarUpload: React.FC<AvatarUploadProps> = ({
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
      // Créer un aperçu local immédiatement
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
      
      // Notifier immédiatement le parent avec l'URL de preview
      onAvatarUpdated(objectUrl);

      // Créer un client Supabase propre pour l'upload
      const storageClient = createStorageClient();

      // Générer un nom de fichier unique qui commence par l'ID de l'utilisateur
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}_${Date.now()}.${fileExt}`;

      // Upload avec gestion explicite du Content-Type
      const { data: uploadData, error: uploadError } = await storageClient.storage
        .from('avatars')
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
        .from('avatars')
        .getPublicUrl(uploadData.path);

      // Log pour vérifier la valeur de userId
      console.log('userId utilisé pour update:', userId);
      // Mettre à jour le profil dans la base de données avec le client principal (authentifié)
      const { error: updateError, data: updateData } = await supabase
        .from('profiles')
        .update({ 
          avatar_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId); // clé primaire

      console.log('Résultat update:', { updateError, updateData });

      if (updateError) {
        throw updateError;
      }

      // Notifier le parent avec l'URL publique finale
      onAvatarUpdated(publicUrl);
      toast.success('Photo de profil mise à jour');

      // Nettoyer l'aperçu
      URL.revokeObjectURL(objectUrl);
      setPreviewUrl(null);

    } catch (error: any) {
      console.error("Erreur technique :", {
        code: error.code,
        status: error.status,
        message: error.message,
        details: error.details,
        fileInfo: file ? {
          name: file.name,
          type: file.type,
          size: file.size
        } : null
      });
      
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

  const getInitials = (userId: string) => {
    return userId.substring(0, 2).toUpperCase();
  };

  return (
    <div className={`flex flex-col items-center space-y-4 ${className}`}>
      {/* Avatar avec overlay pour l'upload */}
      <div className="relative group">
        <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
          <AvatarImage 
            src={previewUrl || currentAvatarUrl} 
            alt="Photo de profil"
            className="object-cover"
            onError={(e) => {
              console.warn('Erreur de chargement de l\'avatar:', e);
              // L'AvatarFallback s'affichera automatiquement
            }}
          />
          <AvatarFallback className="text-lg font-semibold bg-gradient-to-br from-blue-500 to-purple-600 text-white">
            {getInitials(userId)}
          </AvatarFallback>
        </Avatar>

        {/* Overlay pour l'upload */}
        <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
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
          <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
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
              Changer la photo
            </>
          )}
        </Button>
        
        <p className="text-xs text-gray-500 mt-2">
          JPG, PNG ou WebP • Max 5MB
        </p>
      </div>
    </div>
  );
};

export default AvatarUpload; 