import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import SecureFileUpload from '@/components/common/SecureFileUpload';
import { formatFileSize } from '@/utils/fileValidation';
import { 
  FileText, 
  Download, 
  Trash2, 
  Eye, 
  Shield,
  AlertTriangle,
  Plus,
  FolderOpen
} from 'lucide-react';
import { toast } from 'sonner';
// Logger supprimé - utilisation de console directement
interface ProfileDocument {
  id: string;
  user_id: string;
  file_url?: string;
  file_path?: string;
  file_name: string;
  file_size: number;
  file_type: string;
  document_type: string;
  uploaded_at?: string;
  upload_date?: string;
}

interface DocumentsSectionProps {
  userId: string;
}

const DOCUMENT_TYPES = {
  identity: 'Pièce d\'identité',
  address_proof: 'Justificatif de domicile',
  income_proof: 'Justificatif de revenus',
  insurance: 'Assurance',
  contract: 'Contrat',
  other: 'Autre'
};

export const DocumentsSection: React.FC<DocumentsSectionProps> = ({ userId }) => {
  const [documents, setDocuments] = useState<ProfileDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [selectedDocumentType, setSelectedDocumentType] = useState<string>('other');
  
  const [refreshKey, setRefreshKey] = useState(0);
  const [forceRender, setForceRender] = useState(0);

  useEffect(() => {
    loadDocuments();
  }, [userId, refreshKey]);

  const loadDocuments = async () => {
    try {
      const result = await apiClient.get(`/users/${userId}/documents`);
      
      if (result.success && result.data) {
        // S'assurer que result.data est un tableau
        const documentsArray = Array.isArray(result.data) ? result.data : [];
        
        setDocuments(documentsArray);
      } else {
        console.log('⚠️ Aucun document trouvé');
        setDocuments([]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des documents:', error);
      toast.error('Erreur lors du chargement des documents');
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    setForceRender(prev => prev + 1);
  };

  const handleFileUploaded = (fileData: any) => {
    // Déclencher un rafraîchissement complet
    setRefreshKey(prev => prev + 1);
    setForceRender(prev => prev + 1);
    setShowUpload(false);
    toast.success('Document uploadé avec succès');
  };

  const downloadDocument = async (doc: ProfileDocument) => {
    try {
      // Vérifier si on a des données base64 (stockage PostgreSQL)
      if (doc.file_path && !doc.file_path.startsWith('http')) {
        // Document stocké en base64 dans PostgreSQL
        const base64Data = doc.file_path;
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: doc.file_type });

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = doc.file_name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast.success('Document téléchargé');
        return;
      }
      
      // Fallback pour les URLs (ancien système)
      if (doc.file_url) {
        const response = await fetch(doc.file_url);
        if (!response.ok) {
          throw new Error('Erreur lors du téléchargement du fichier');
        }
        const data = await response.blob();

        // Créer un lien de téléchargement
        const url = URL.createObjectURL(data);
        const a = document.createElement('a');
        a.href = url;
        a.download = doc.file_name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast.success('Document téléchargé');
      } else {
        toast.error('Document non disponible');
      }
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      toast.error('Erreur lors du téléchargement');
    }
  };

  const deleteDocument = async (doc: ProfileDocument) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) {
      return;
    }

    try {
      // Supprimer de la base de données via l'API
      const result = await apiClient.delete(`/users/${userId}/documents/${doc.id}`);
      
      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de la suppression');
      }

      // Pour PostgreSQL, pas besoin de suppression de storage spéciale
      console.log('Document supprimé avec succès');

      // Déclencher un rafraîchissement complet
      console.log('✅ Document supprimé, rafraîchissement de la liste...');
      setRefreshKey(prev => prev + 1);
      setForceRender(prev => prev + 1);
      toast.success('Document supprimé');
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) {
      return <FileText className="h-5 w-5 text-red-500" />;
    }
    if (fileType.includes('image')) {
      return <FileText className="h-5 w-5 text-blue-500" />;
    }
    return <FileText className="h-5 w-5 text-gray-500" />;
  };

  const getDocumentTypeBadge = (type: string) => {
    const label = DOCUMENT_TYPES[type as keyof typeof DOCUMENT_TYPES] || 'Autre';
    const colors = {
      identity: 'bg-blue-100 text-blue-800',
      address_proof: 'bg-green-100 text-green-800',
      income_proof: 'bg-yellow-100 text-yellow-800',
      insurance: 'bg-purple-100 text-purple-800',
      contract: 'bg-orange-100 text-orange-800',
      other: 'bg-gray-100 text-gray-800'
    };
    
    return (
      <Badge className={colors[type as keyof typeof colors] || colors.other}>
        {label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-2">
              <div className="h-3 bg-gray-200 rounded"></div>
              <div className="h-3 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-blue-600" />
            <CardTitle>Documents</CardTitle>
          </div>
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            🔄 Actualiser
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6" key={`documents-content-${forceRender}`}>
        {/* Bouton Ajouter un document */}
        <div className="flex justify-start">
          <Button
            onClick={() => {
              setShowUpload(!showUpload);
              // Ne plus réinitialiser automatiquement le type de document
              // L'utilisateur peut garder son choix précédent
            }}
            size="sm"
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Ajouter un document
          </Button>
        </div>

        {/* Informations de sécurité */}
        <Alert className="border-green-200 bg-green-50">
          <Shield className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Vos documents sont stockés de manière sécurisée et chiffrée. 
            Ils sont scannés automatiquement pour détecter les menaces.
          </AlertDescription>
        </Alert>

        {/* Zone d'upload */}
        {showUpload && (
          <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type de document
              </label>
              <select
                value={selectedDocumentType}
                onChange={(e) => {
                  setSelectedDocumentType(e.target.value);
                }}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {Object.entries(DOCUMENT_TYPES).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <SecureFileUpload
              key={`upload-${selectedDocumentType}`} // Force le re-render quand le type change
              onFileUploaded={handleFileUploaded}
              documentType={selectedDocumentType}
              acceptedTypes={['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx']}
              maxSize={10 * 1024 * 1024} // 10MB
              userId={userId}
            />
          </div>
        )}

        {/* Liste des documents */}
        {!Array.isArray(documents) || documents.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FolderOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">Aucun document</p>
            <p className="text-sm">Ajoutez vos premiers documents sécurisés</p>
          </div>
        ) : (
          <div className="space-y-3" key={`documents-list-${forceRender}`}>
            {documents.map((doc) => (
              <div
                key={`${doc.id}-${forceRender}`}
                className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                {getFileIcon(doc.file_type)}
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {doc.file_name}
                    </p>
                    {getDocumentTypeBadge(doc.document_type)}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>{formatFileSize(doc.file_size)}</span>
                    <span>
                      Ajouté le {new Date(doc.upload_date || doc.uploaded_at).toLocaleDateString('fr-FR', {
                        timeZone: 'Europe/Paris',
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => downloadDocument(doc)}
                    className="h-8 w-8 p-0"
                    title="Télécharger"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteDocument(doc)}
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                    title="Supprimer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Statistiques */}
        {documents.length > 0 && (
          <div className="pt-4 border-t">
            <div className="flex justify-between text-sm text-gray-600">
              <span>{documents.length} document{documents.length > 1 ? 's' : ''}</span>
              <span>
                {formatFileSize(documents.reduce((total, doc) => total + doc.file_size, 0))} au total
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DocumentsSection; 