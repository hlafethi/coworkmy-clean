import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Archive, 
  ArchiveRestore, 
  Eye, 
  EyeOff, 
  Save, 
  X,
  FileText,
  Calendar,
  User,
  Search,
  Filter,
  MoreHorizontal
} from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';

interface LegalPage {
  id: string;
  title: string;
  content: string;
  type: 'terms' | 'privacy' | 'legal' | 'custom';
  is_active: boolean;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  author_id?: string;
  author_name?: string;
}

const AdminLegalPagesManager = () => {
  const [pages, setPages] = useState<LegalPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  // États pour les modales
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [selectedPage, setSelectedPage] = useState<LegalPage | null>(null);
  
  // États pour les formulaires
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'custom' as const,
    is_active: true
  });

  // Charger les pages légales
  const fetchPages = async () => {
    try {
      setLoading(true);
      const result = await apiClient.get('/legal-pages');
      
      if (result.success && Array.isArray(result.data)) {
        setPages(result.data);
      } else {
        console.error('Erreur lors du chargement des pages:', result.error);
        toast.error('Erreur lors du chargement des pages légales');
      }
    } catch (error) {
      console.error('Erreur lors du chargement des pages:', error);
      toast.error('Erreur lors du chargement des pages légales');
    } finally {
      setLoading(false);
    }
  };

  // Créer une nouvelle page
  const handleCreate = async () => {
    try {
      setSaving(true);
      const result = await apiClient.post('/legal-pages', formData);
      
      if (result.success) {
        toast.success('Page légale créée avec succès');
        setCreateDialogOpen(false);
        setFormData({ title: '', content: '', type: 'custom', is_active: true });
        await fetchPages();
      } else {
        toast.error(result.error || 'Erreur lors de la création');
      }
    } catch (error) {
      console.error('Erreur lors de la création:', error);
      toast.error('Erreur lors de la création de la page');
    } finally {
      setSaving(false);
    }
  };

  // Modifier une page
  const handleUpdate = async () => {
    if (!selectedPage) return;
    
    try {
      setSaving(true);
      const result = await apiClient.put(`/legal-pages/${selectedPage.id}`, formData);
      
      if (result.success) {
        toast.success('Page légale modifiée avec succès');
        setEditDialogOpen(false);
        setSelectedPage(null);
        setFormData({ title: '', content: '', type: 'custom', is_active: true });
        await fetchPages();
      } else {
        toast.error(result.error || 'Erreur lors de la modification');
      }
    } catch (error) {
      console.error('Erreur lors de la modification:', error);
      toast.error('Erreur lors de la modification de la page');
    } finally {
      setSaving(false);
    }
  };

  // Supprimer une page
  const handleDelete = async () => {
    if (!selectedPage) return;
    
    try {
      setSaving(true);
      const result = await apiClient.delete(`/legal-pages/${selectedPage.id}`);
      
      if (result.success) {
        toast.success('Page légale supprimée avec succès');
        setDeleteDialogOpen(false);
        setSelectedPage(null);
        await fetchPages();
      } else {
        toast.error(result.error || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast.error('Erreur lors de la suppression de la page');
    } finally {
      setSaving(false);
    }
  };

  // Archiver/Désarchiver une page
  const handleToggleArchive = async (page: LegalPage) => {
    try {
      setSaving(true);
      const result = await apiClient.put(`/legal-pages/${page.id}`, {
        ...page,
        is_archived: !page.is_archived
      });
      
      if (result.success) {
        toast.success(page.is_archived ? 'Page désarchivée' : 'Page archivée');
        await fetchPages();
      } else {
        toast.error(result.error || 'Erreur lors de l\'archivage');
      }
    } catch (error) {
      console.error('Erreur lors de l\'archivage:', error);
      toast.error('Erreur lors de l\'archivage de la page');
    } finally {
      setSaving(false);
    }
  };

  // Activer/Désactiver une page
  const handleToggleActive = async (page: LegalPage) => {
    try {
      setSaving(true);
      const result = await apiClient.put(`/legal-pages/${page.id}`, {
        ...page,
        is_active: !page.is_active
      });
      
      if (result.success) {
        toast.success(page.is_active ? 'Page désactivée' : 'Page activée');
        await fetchPages();
      } else {
        toast.error(result.error || 'Erreur lors du changement de statut');
      }
    } catch (error) {
      console.error('Erreur lors du changement de statut:', error);
      toast.error('Erreur lors du changement de statut');
    } finally {
      setSaving(false);
    }
  };

  // Ouvrir le dialogue d'édition
  const openEditDialog = (page: LegalPage) => {
    setSelectedPage(page);
    setFormData({
      title: page.title,
      content: page.content,
      type: page.type,
      is_active: page.is_active
    });
    setEditDialogOpen(true);
  };

  // Ouvrir le dialogue de suppression
  const openDeleteDialog = (page: LegalPage) => {
    setSelectedPage(page);
    setDeleteDialogOpen(true);
  };

  // Ouvrir le dialogue de prévisualisation
  const openPreviewDialog = (page: LegalPage) => {
    setSelectedPage(page);
    setPreviewDialogOpen(true);
  };

  // Filtrer les pages
  const filteredPages = pages.filter(page => {
    const matchesSearch = page.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         page.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || page.type === filterType;
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && page.is_active && !page.is_archived) ||
                         (filterStatus === 'inactive' && !page.is_active && !page.is_archived) ||
                         (filterStatus === 'archived' && page.is_archived);
    
    return matchesSearch && matchesType && matchesStatus;
  });

  useEffect(() => {
    fetchPages();
  }, []);

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'terms': return 'Conditions Générales';
      case 'privacy': return 'Politique de Confidentialité';
      case 'legal': return 'Mentions Légales';
      case 'custom': return 'Page Personnalisée';
      default: return type;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Gestion des Pages Légales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p>Chargement des pages légales...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec actions */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Gestion des Pages Légales
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Créez, modifiez et gérez les pages légales de votre site
              </p>
            </div>
            <Button onClick={() => setCreateDialogOpen(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nouvelle Page
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Barre de recherche et filtres */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Rechercher dans les pages..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Type de page" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="terms">Conditions Générales</SelectItem>
                  <SelectItem value="privacy">Politique de Confidentialité</SelectItem>
                  <SelectItem value="legal">Mentions Légales</SelectItem>
                  <SelectItem value="custom">Pages Personnalisées</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="active">Actives</SelectItem>
                  <SelectItem value="inactive">Inactives</SelectItem>
                  <SelectItem value="archived">Archivées</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tableau des pages */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Titre</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Dernière modification</TableHead>
                  <TableHead>Auteur</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPages.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Aucune page trouvée
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPages.map((page) => (
                    <TableRow key={page.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{page.title}</div>
                            <div className="text-sm text-muted-foreground">
                              {page.content.substring(0, 100)}...
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getTypeLabel(page.type)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {page.is_active ? (
                            <Badge variant="default" className="bg-green-100 text-green-800">
                              <Eye className="h-3 w-3 mr-1" />
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              <EyeOff className="h-3 w-3 mr-1" />
                              Inactive
                            </Badge>
                          )}
                          {page.is_archived && (
                            <Badge variant="outline" className="border-orange-200 text-orange-800">
                              <Archive className="h-3 w-3 mr-1" />
                              Archivée
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {formatDate(page.updated_at)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <User className="h-4 w-4" />
                          {page.author_name || 'Système'}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openPreviewDialog(page)}
                            title="Prévisualiser"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(page)}
                            title="Modifier"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleActive(page)}
                            title={page.is_active ? 'Désactiver' : 'Activer'}
                          >
                            {page.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleArchive(page)}
                            title={page.is_archived ? 'Désarchiver' : 'Archiver'}
                          >
                            {page.is_archived ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDeleteDialog(page)}
                            title="Supprimer"
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialogue de création */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Créer une nouvelle page légale</DialogTitle>
            <DialogDescription>
              Remplissez les informations pour créer une nouvelle page légale.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Titre</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Titre de la page"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Type</label>
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value as any })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="terms">Conditions Générales</SelectItem>
                  <SelectItem value="privacy">Politique de Confidentialité</SelectItem>
                  <SelectItem value="legal">Mentions Légales</SelectItem>
                  <SelectItem value="custom">Page Personnalisée</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Contenu</label>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Contenu de la page (HTML autorisé)"
                rows={10}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="rounded"
              />
              <label htmlFor="is_active" className="text-sm font-medium">
                Page active
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreate} disabled={saving}>
              {saving ? 'Création...' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialogue d'édition */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Modifier la page légale</DialogTitle>
            <DialogDescription>
              Modifiez les informations de la page légale.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Titre</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Titre de la page"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Type</label>
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value as any })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="terms">Conditions Générales</SelectItem>
                  <SelectItem value="privacy">Politique de Confidentialité</SelectItem>
                  <SelectItem value="legal">Mentions Légales</SelectItem>
                  <SelectItem value="custom">Page Personnalisée</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Contenu</label>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Contenu de la page (HTML autorisé)"
                rows={10}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_active_edit"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="rounded"
              />
              <label htmlFor="is_active_edit" className="text-sm font-medium">
                Page active
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleUpdate} disabled={saving}>
              {saving ? 'Sauvegarde...' : 'Sauvegarder'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialogue de suppression */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer la page légale</DialogTitle>
            <DialogDescription>
              Cette action est irréversible. La page sera définitivement supprimée.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p>Êtes-vous sûr de vouloir supprimer la page <strong>"{selectedPage?.title}"</strong> ?</p>
            <p className="text-sm text-muted-foreground mt-2">
              Cette action est irréversible.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={saving}>
              {saving ? 'Suppression...' : 'Supprimer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialogue de prévisualisation */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Prévisualisation - {selectedPage?.title}</DialogTitle>
            <DialogDescription>
              Aperçu du contenu de la page légale.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {selectedPage && (
              <div className="prose max-w-none">
                <div dangerouslySetInnerHTML={{ __html: selectedPage.content }} />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewDialogOpen(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminLegalPagesManager;
