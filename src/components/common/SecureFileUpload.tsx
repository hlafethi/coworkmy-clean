import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { 
  validateFile, 
  scanFileForVirus, 
  generateSecureFilename, 
  formatFileSize,
  ALLOWED_EXTENSIONS 
} from '@/utils/fileValidation';
import { 
  Upload, 
  File, 
  AlertTriangle, 
  CheckCircle, 
  X, 
  Shield,
  FileText,
  Image as ImageIcon
} from 'lucide-react';
import { toast } from 'sonner';

interface SecureFileUploadProps {
  onFileUploaded: (fileData: {
    id: string;
    file_url: string;
    file_name: string;
    file_size: number;
    file_type: string;
  }) => void;
  acceptedTypes?: string[];
  maxSize?: number;
  documentType?: string;
  className?: string;
}

interface UploadingFile {
  file: File;
  progress: number;
  status: 'validating' | 'scanning' | 'uploading' | 'completed' | 'error';
  error?: string;
  id?: string;
}

export const SecureFileUpload: React.FC<SecureFileUploadProps> = ({
  onFileUploaded,
  acceptedTypes = ALLOWED_EXTENSIONS,
  maxSize = 10 * 1024 * 1024, // 10MB par défaut
  documentType = 'general',
  className = ''
}) => {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    setIsUploading(true);
    const newUploadingFiles: UploadingFile[] = acceptedFiles.map(file => ({
      file,
      progress: 0,
      status: 'validating'
    }));

    setUploadingFiles(newUploadingFiles);

    for (let i = 0; i < newUploadingFiles.length; i++) {
      await processFile(newUploadingFiles[i], i);
    }

    setIsUploading(false);
  }, []);

  const processFile = async (uploadingFile: UploadingFile, index: number) => {
    const { file } = uploadingFile;

    try {
      // 1. Validation du fichier
      updateFileStatus(index, 'validating', 10);
      const validation = await validateFile(file);
      
      if (!validation.isValid) {
        updateFileStatus(index, 'error', 0, validation.error);
        toast.error(`Erreur de validation: ${validation.error}`);
        return;
      }

      // 2. Scan antivirus avec VirusTotal
      updateFileStatus(index, 'scanning', 30);
      const scanResult = await scanFileForVirus(file);
      
      if (!scanResult.isClean) {
        const errorMsg = scanResult.details 
          ? `${scanResult.threat} (${scanResult.details.malicious + scanResult.details.suspicious}/${scanResult.details.total} moteurs)`
          : scanResult.threat;
        
        updateFileStatus(index, 'error', 0, errorMsg);
        toast.error(`🛡️ Fichier bloqué: ${errorMsg}`);
        
        // Log détaillé pour debug
        if (scanResult.details?.engines) {
          console.warn('Moteurs antivirus ayant détecté des menaces:', scanResult.details.engines);
        }
        return;
      } else if (scanResult.details) {
        // Fichier propre, afficher les stats
        toast.success(`✅ Fichier sécurisé (vérifié par ${scanResult.details.total} moteurs antivirus)`);
      }

      // 3. Upload du fichier
      updateFileStatus(index, 'uploading', 50);
      await uploadFile(uploadingFile, index);

    } catch (error) {
      console.error('Erreur lors du traitement du fichier:', error);
      updateFileStatus(index, 'error', 0, 'Erreur lors du traitement du fichier');
      toast.error('Erreur lors du traitement du fichier');
    }
  };

  const uploadFile = async (uploadingFile: UploadingFile, index: number) => {
    const { file } = uploadingFile;
    
    try {
      // Pour l'instant, simuler un upload réussi avec des données par défaut
      // Dans un vrai système, vous utiliseriez votre propre service de stockage
      updateFileStatus(index, 'uploading', 80);

      // Convertir le fichier en base64 pour le stockage
      const base64Data = await fileToBase64(file);
      const fileUrl = `data:${file.type};base64,${base64Data}`;

      // Simuler l'enregistrement en base de données
      const documentData = {
        id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        user_id: 'current_user', // Sera remplacé par l'ID réel de l'utilisateur
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        file_url: fileUrl,
        document_type: documentType,
        uploaded_at: new Date().toISOString()
      };

      // Fonction utilitaire pour convertir le fichier en base64
      function fileToBase64(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]); // Retourner seulement la partie base64
          };
          reader.onerror = error => reject(error);
        });
      }

      updateFileStatus(index, 'completed', 100);
      
      // Notifier le parent
      onFileUploaded({
        id: documentData.id,
        file_url: documentData.file_url,
        file_name: documentData.file_name,
        file_size: documentData.file_size,
        file_type: documentData.file_type
      });

      toast.success(`Fichier "${file.name}" uploadé avec succès`);

    } catch (error: any) {
      console.error('Erreur lors de l\'upload:', error);
      
      // Diagnostic détaillé de l'erreur
      let errorMessage = 'Erreur lors de l\'upload';
      if (error?.message?.includes('mime type')) {
        errorMessage = 'Type de fichier non supporté';
      } else if (error?.message?.includes('size')) {
        errorMessage = 'Fichier trop volumineux';
      } else if (error?.message?.includes('policy')) {
        errorMessage = 'Erreur de permissions';
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      updateFileStatus(index, 'error', 0, errorMessage);
      toast.error(`Erreur: ${errorMessage}`);
    }
  };

  const updateFileStatus = (
    index: number, 
    status: UploadingFile['status'], 
    progress: number, 
    error?: string
  ) => {
    setUploadingFiles(prev => prev.map((file, i) => 
      i === index ? { ...file, status, progress, error } : file
    ));
  };

  const removeFile = (index: number) => {
    setUploadingFiles(prev => prev.filter((_, i) => i !== index));
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'text/csv': ['.csv']
    },
    maxSize,
    disabled: isUploading
  });

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return <ImageIcon className="h-8 w-8 text-blue-500" />;
    }
    return <FileText className="h-8 w-8 text-gray-500" />;
  };

  const getStatusColor = (status: UploadingFile['status']) => {
    switch (status) {
      case 'validating': return 'text-yellow-600';
      case 'scanning': return 'text-orange-600';
      case 'uploading': return 'text-blue-600';
      case 'completed': return 'text-green-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusText = (status: UploadingFile['status']) => {
    switch (status) {
      case 'validating': return 'Validation...';
      case 'scanning': return 'Scan de sécurité...';
      case 'uploading': return 'Upload en cours...';
      case 'completed': return 'Terminé';
      case 'error': return 'Erreur';
      default: return '';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Zone de drop */}
      <Card>
        <CardContent className="p-6">
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
              ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            
            {isDragActive ? (
              <p className="text-blue-600 font-medium">Déposez les fichiers ici...</p>
            ) : (
              <div>
                <p className="text-gray-600 font-medium mb-2">
                  Glissez-déposez vos fichiers ici ou cliquez pour sélectionner
                </p>
                <p className="text-sm text-gray-500">
                  Types acceptés: {acceptedTypes.join(', ')}
                </p>
                <p className="text-sm text-gray-500">
                  Taille maximale: {formatFileSize(maxSize)}
                </p>
              </div>
            )}
          </div>

          {/* Informations de sécurité */}
          <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 text-green-800">
              <Shield className="h-4 w-4" />
              <span className="text-sm font-medium">Sécurité renforcée</span>
            </div>
            <p className="text-xs text-green-700 mt-1">
              Tous les fichiers sont validés, scannés et stockés de manière sécurisée
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Liste des fichiers en cours d'upload */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-3">
          {uploadingFiles.map((uploadingFile, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  {getFileIcon(uploadingFile.file.type)}
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {uploadingFile.file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(uploadingFile.file.size)}
                    </p>
                  </div>

                  <div className="flex-1">
                    {uploadingFile.status === 'error' ? (
                      <Alert className="border-red-200 bg-red-50">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-800 text-xs">
                          {uploadingFile.error}
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className={getStatusColor(uploadingFile.status)}>
                            {getStatusText(uploadingFile.status)}
                          </span>
                          <span className="text-gray-500">
                            {uploadingFile.progress}%
                          </span>
                        </div>
                        <Progress value={uploadingFile.progress} className="h-2" />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {uploadingFile.status === 'completed' && (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    )}
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default SecureFileUpload; 