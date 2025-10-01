import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { 
  FileText, 
  Download, 
  Eye, 
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  Building2,
  User,
  X
} from 'lucide-react';
import { toast } from 'sonner';

interface UserDocument {
  id: string;
  user_id: string;
  file_url: string;
  file_name: string;
  file_size: number;
  file_type: string;
  document_type: string;
  uploaded_at: string;
  scan_status?: 'pending' | 'clean' | 'infected' | 'error';
  scan_details?: any;
}

interface UserDocumentsProps {
  userId: string;
  userName?: string;
  userCompany?: string;
}

const DOCUMENT_TYPES = {
  identity: 'Pièce d\'identité',
  address_proof: 'Justificatif de domicile',
  income_proof: 'Justificatif de revenus',
  insurance: 'Assurance',
  contract: 'Contrat',
  other: 'Autre'
};

export const UserDocuments: React.FC<UserDocumentsProps> = ({ 
  userId, 
  userName = 'Utilisateur',
  userCompany 
}) => {
  const [documents, setDocuments] = useState<UserDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDocument, setSelectedDocument] = useState<UserDocument | null>(null);
  const [documentUrl, setDocumentUrl] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, [userId]);

  const loadDocuments = async () => {
    try {
      console.log('🔍 Chargement des documents pour userId:', userId);
      console.log('userId utilisé pour la requête:', userId, typeof userId);
      
      // Utiliser l'API client au lieu de Supabase
      const result = await apiClient.get(`/users/${userId}/documents`);
      
      if (result.success && result.data) {
        console.log('📄 Tous les documents:', result.data);
        
        // Transformer les données pour correspondre à l'interface UserDocument
        const transformedData = result.data.map((doc: any) => ({
          id: doc.id,
          user_id: doc.user_id,
          file_url: doc.file_url || doc.document_url || '',
          file_name: doc.file_name || `Document ${doc.document_type}`,
          file_size: doc.file_size || 0,
          file_type: doc.file_type || 'application/octet-stream',
          document_type: doc.document_type,
          uploaded_at: doc.uploaded_at,
          scan_status: 'pending' // Pas de colonne verified dans la structure actuelle
        }));

        console.log('✅ Documents transformés:', transformedData.length, 'documents');
        setDocuments(transformedData);
      } else {
        console.log('⚠️ Aucun document trouvé ou erreur API');
        setDocuments([]);
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement des documents:', error);
      toast.error('Erreur lors du chargement des documents');
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  const downloadDocument = async (document: UserDocument) => {
    try {
      if (!document.file_url) {
        toast.error('URL du document non disponible');
        return;
      }

      // Si c'est une URL complète, télécharger directement
      if (document.file_url.startsWith('http')) {
        const response = await fetch(document.file_url);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = window.document.createElement('a');
        a.href = url;
        a.download = document.file_name;
        window.document.body.appendChild(a);
        a.click();
        window.document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        // Pour les chemins relatifs, utiliser l'URL directement
        // (PostgreSQL ne nécessite pas de téléchargement spécial comme Supabase)
        const response = await fetch(document.file_url);
        if (!response.ok) {
          throw new Error('Erreur lors du téléchargement du fichier');
        }
        const data = await response.blob();

        const url = URL.createObjectURL(data);
        const a = window.document.createElement('a');
        a.href = url;
        a.download = document.file_name;
        window.document.body.appendChild(a);
        a.click();
        window.document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      toast.success('Document téléchargé');
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      toast.error('Erreur lors du téléchargement');
    }
  };

  const viewDocument = async (document: UserDocument) => {
    try {
      if (!document.file_url) {
        toast.error('URL du document non disponible');
        return;
      }

      let url = '';
      
      // Si c'est une URL complète, utiliser directement
      if (document.file_url.startsWith('http')) {
        url = document.file_url;
      } else {
        // Pour les chemins relatifs, utiliser l'URL directement
        // (PostgreSQL ne nécessite pas d'URL signée comme Supabase)
        url = document.file_url;
      }

      console.log('🔍 Debug document:', {
        fileName: document.file_name,
        fileType: document.file_type,
        fileUrl: document.file_url,
        signedUrl: url,
        isPdf: document.file_type.includes('pdf'),
        isImage: document.file_type.includes('image'),
        extension: document.file_name.split('.').pop()?.toLowerCase()
      });

      setSelectedDocument(document);
      setDocumentUrl(url);
      setIsModalOpen(true);
    } catch (error) {
      console.error('Erreur lors de l\'ouverture du document:', error);
      toast.error('Erreur lors de l\'ouverture du document');
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedDocument(null);
    setDocumentUrl('');
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

  const getScanStatusBadge = (document: UserDocument) => {
    if (!document.scan_status) {
      return (
        <Badge variant="outline" className="text-gray-600">
          <Clock className="h-3 w-3 mr-1" />
          Non vérifié
        </Badge>
      );
    }

    switch (document.scan_status) {
      case 'clean':
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Sécurisé
          </Badge>
        );
      case 'infected':
        return (
          <Badge className="bg-red-100 text-red-800">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Menace détectée
          </Badge>
        );
      case 'error':
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Erreur de scan
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-gray-600">
            <Clock className="h-3 w-3 mr-1" />
            En cours
          </Badge>
        );
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getDocumentType = (document: UserDocument) => {
    // Vérifier d'abord le type MIME
    if (document.file_type.includes('pdf')) return 'pdf';
    if (document.file_type.includes('image')) return 'image';
    
    // Fallback sur l'extension du fichier (nom du fichier)
    const fileName = document.file_name;
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    // Vérifier aussi l'extension dans l'URL si disponible
    const urlExtension = document.file_url.split('.').pop()?.toLowerCase();
    
    console.log('🔍 Analyse type fichier:', {
      fileName,
      fileType: document.file_type,
      extension,
      urlExtension,
      fileUrl: document.file_url
    });
    
    // Détecter le type depuis l'extension
    const allExtensions = [extension, urlExtension].filter(Boolean);
    
    for (const ext of allExtensions) {
      if (ext === 'pdf') return 'pdf';
      if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'tiff'].includes(ext)) return 'image';
      if (['doc', 'docx'].includes(ext)) return 'document';
      if (['xls', 'xlsx'].includes(ext)) return 'spreadsheet';
      if (['txt', 'rtf'].includes(ext)) return 'text';
    }
    
    // Si on a une URL qui contient des indices d'image
    if (document.file_url.includes('.png') || 
        document.file_url.includes('.jpg') || 
        document.file_url.includes('.jpeg') || 
        document.file_url.includes('.gif') ||
        document.file_url.includes('.webp')) {
      return 'image';
    }
    
    return 'other';
  };

  // Ajout du log pour debug
  console.log('🟢 Documents à afficher:', documents);

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
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Documents de {userName}
            {userCompany && (
              <span className="text-sm text-gray-500 font-normal">
                ({userCompany})
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <Alert>
              <AlertDescription>
                Aucun document uploadé par cet utilisateur.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {documents.map((document) => (
                <div
                  key={document.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    {getFileIcon(document.file_type)}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-sm truncate">
                          {document.file_name}
                        </p>
                        {getDocumentTypeBadge(document.document_type)}
                        {getScanStatusBadge(document)}
                      </div>
                      
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>{formatFileSize(document.file_size)}</span>
                        <span>•</span>
                        <span>
                          Uploadé le {new Date(document.uploaded_at).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => viewDocument(document)}
                      className="flex items-center gap-1"
                      disabled={!document.file_url}
                    >
                      <Eye className="h-4 w-4" />
                      Voir
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadDocument(document)}
                      className="flex items-center gap-1"
                      disabled={!document.file_url}
                    >
                      <Download className="h-4 w-4" />
                      Télécharger
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modale d'affichage du document */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>
              {selectedDocument?.file_name}
            </DialogTitle>
            <DialogDescription>
              {selectedDocument?.document_type && (
                <Badge variant="outline" className="mt-2">
                  {DOCUMENT_TYPES[selectedDocument.document_type as keyof typeof DOCUMENT_TYPES] || 'Autre'}
                </Badge>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-hidden">
            {documentUrl && selectedDocument && (
              (() => {
                const docType = getDocumentType(selectedDocument);
                console.log('🎨 Affichage document:', {
                  fileName: selectedDocument.file_name,
                  fileType: selectedDocument.file_type,
                  docType,
                  url: documentUrl
                });

                switch (docType) {
                  case 'pdf':
                    return (
                      <iframe
                        src={documentUrl}
                        className="w-full h-[70vh] border rounded"
                        title={selectedDocument.file_name}
                      />
                    );
                  case 'image':
                    return (
                      <div className="flex justify-center">
                        <img
                          src={documentUrl}
                          alt={selectedDocument.file_name}
                          className="max-w-full max-h-[70vh] object-contain rounded"
                          onError={(e) => {
                            console.error('❌ Erreur chargement image:', e);
                            toast.error('Erreur lors du chargement de l\'image');
                          }}
                        />
                      </div>
                    );
                  default:
                    return (
                      <div className="flex items-center justify-center h-[70vh] bg-gray-50 rounded">
                        <div className="text-center">
                          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-600 mb-2">
                            Aperçu non disponible pour ce type de fichier
                          </p>
                          <p className="text-sm text-gray-500 mb-4">
                            Type: {selectedDocument.file_type} | Extension: {selectedDocument.file_name.split('.').pop()}
                          </p>
                          <Button
                            variant="outline"
                            onClick={() => downloadDocument(selectedDocument)}
                            className="mt-4"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Télécharger pour voir
                          </Button>
                        </div>
                      </div>
                    );
                }
              })()
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}; 