import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { AdminSupportService } from '@/services/adminSupportService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Edit, Trash2, Save, X, FileText, Plus, Eye, EyeOff } from 'lucide-react';

interface KBArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const CATEGORIES = [
  { value: 'general', label: 'Général' },
  { value: 'utilisation', label: 'Utilisation' },
  { value: 'tarifs', label: 'Tarifs' },
  { value: 'technique', label: 'Technique' },
  { value: 'services', label: 'Services' },
  { value: 'autre', label: 'Autre' },
];

// Composant d'upload d'image simplifié pour KB
const KBImageUpload = ({ onImageChange, imagePreview }: { onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void; imagePreview: string | null }) => {
  return (
    <div className="space-y-2">
      <Input
        id="imageUpload"
        type="file"
        accept="image/*"
        onChange={onImageChange}
        className="cursor-pointer"
      />
      {imagePreview && (
        <div className="relative w-full h-40 rounded-md overflow-hidden border">
          <img 
            src={imagePreview} 
            alt="Prévisualisation" 
            className="w-full h-full object-cover"
          />
        </div>
      )}
    </div>
  );
};

export const AdminSupportKnowledgeBase = () => {
  const [articles, setArticles] = useState<KBArticle[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<KBArticle | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [newArticle, setNewArticle] = useState({
    title: '',
    content: '',
    category: 'general',
    order_index: 0,
    is_active: true,
  });
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const fetchArticles = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log('[AdminSupportKnowledgeBase] Chargement des articles...');
      const data = await AdminSupportService.getKBArticles();
      console.log('[AdminSupportKnowledgeBase] Articles chargés:', data?.length || 0);
      setArticles(data || []);
    } catch (err) {
      console.error('[AdminSupportKnowledgeBase] Erreur inattendue:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      toast.error('Erreur inattendue');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { 
    fetchArticles(); 
  }, [fetchArticles]);

  // Ajout
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newArticle.title.trim() || !newArticle.content.trim()) {
      toast.error('Titre et contenu obligatoires');
      return;
    }
    
    setIsLoading(true);
    try {
      console.log('[AdminSupportKnowledgeBase] Création article:', newArticle);
      const { error } = await supabase.from('support_kb_articles').insert([
        { 
          ...newArticle, 
          title: newArticle.title.trim(), 
          content: newArticle.content.trim() 
        },
      ]);
      
      if (error) {
        console.error('[AdminSupportKnowledgeBase] Erreur création:', error);
        setError(error.message);
        toast.error('Erreur lors de la création');
        return;
      }
      
      toast.success('Article créé avec succès');
      setShowForm(false);
      setNewArticle({ title: '', content: '', category: 'general', order_index: 0, is_active: true });
      await fetchArticles();
    } catch (err) {
      console.error('[AdminSupportKnowledgeBase] Erreur inattendue création:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      toast.error('Erreur inattendue');
    } finally {
      setIsLoading(false);
    }
  };

  // Edition
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing || !editing.title.trim() || !editing.content.trim()) {
      toast.error('Titre et contenu obligatoires');
      return;
    }
    
    setIsLoading(true);
    try {
      console.log('[AdminSupportKnowledgeBase] Mise à jour article:', editing.id);
      const { error } = await supabase.from('support_kb_articles')
        .update({
          title: editing.title.trim(),
          content: editing.content.trim(),
          category: editing.category,
          order_index: editing.order_index,
          is_active: editing.is_active,
        })
        .eq('id', editing.id);
      
      if (error) {
        console.error('[AdminSupportKnowledgeBase] Erreur mise à jour:', error);
        setError(error.message);
        toast.error('Erreur lors de la mise à jour');
        return;
      }
      
      toast.success('Article mis à jour avec succès');
      setEditing(null);
      await fetchArticles();
    } catch (err) {
      console.error('[AdminSupportKnowledgeBase] Erreur inattendue mise à jour:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      toast.error('Erreur inattendue');
    } finally {
      setIsLoading(false);
    }
  };

  // Suppression
  const handleDelete = async (id: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet article ?')) return;
    
    setIsLoading(true);
    try {
      console.log('[AdminSupportKnowledgeBase] Suppression article:', id);
      const { error } = await supabase.from('support_kb_articles').delete().eq('id', id);
      
      if (error) {
        console.error('[AdminSupportKnowledgeBase] Erreur suppression:', error);
        setError(error.message);
        toast.error('Erreur lors de la suppression');
        return;
      }
      
      toast.success('Article supprimé avec succès');
      await fetchArticles();
    } catch (err) {
      console.error('[AdminSupportKnowledgeBase] Erreur inattendue suppression:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      toast.error('Erreur inattendue');
    } finally {
      setIsLoading(false);
    }
  };

  // Activation/désactivation
  const handleToggleActive = async (article: KBArticle) => {
    setIsLoading(true);
    try {
      console.log('[AdminSupportKnowledgeBase] Changement statut article:', article.id);
      const { error } = await supabase.from('support_kb_articles')
        .update({ is_active: !article.is_active })
        .eq('id', article.id);
      
      if (error) {
        console.error('[AdminSupportKnowledgeBase] Erreur changement statut:', error);
        setError(error.message);
        toast.error('Erreur lors du changement de statut');
        return;
      }
      
      toast.success(`Article ${!article.is_active ? 'activé' : 'désactivé'} avec succès`);
      await fetchArticles();
    } catch (err) {
      console.error('[AdminSupportKnowledgeBase] Erreur inattendue changement statut:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      toast.error('Erreur inattendue');
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction d'upload d'image
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, isEdit = false) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
      const filePath = fileName;
      const storage = createStorageClient();
      const { error: uploadError } = await storage.storage.from('kb-articles').upload(filePath, file, { upsert: true });
      if (uploadError) {
        toast.error('Erreur lors de l\'upload de l\'image');
        setUploading(false);
        return;
      }
      // Récupérer l'URL publique
      const { data } = storage.storage.from('kb-articles').getPublicUrl(filePath);
      if (!data?.publicUrl) {
        toast.error('Impossible de récupérer l\'URL de l\'image');
        setUploading(false);
        return;
      }
      setImagePreview(data.publicUrl);
      // Insérer le markdown dans le contenu à la position du curseur
      const markdown = `![image](${data.publicUrl})`;
      if (isEdit && editing) {
        setEditing({ ...editing, content: editing.content + '\n' + markdown });
      } else if (!isEdit) {
        setNewArticle({ ...newArticle, content: newArticle.content + '\n' + markdown });
      }
      toast.success('Image uploadée et insérée dans le contenu');
    } catch (err) {
      toast.error('Erreur inattendue lors de l\'upload');
    } finally {
      setUploading(false);
    }
  };

  // Afficher les erreurs
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6" /> Base de connaissances
          </h2>
        </div>
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800">Erreur de chargement</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700 mb-4">{error}</p>
            <Button onClick={fetchArticles} disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Réessayer'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="h-6 w-6" /> Base de connaissances
        </h2>
        <Button onClick={() => { setShowForm(true); setEditing(null); }} disabled={isLoading}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvel article
        </Button>
      </div>

      {/* Formulaire de création */}
      {showForm && (
        <Card className="mb-4 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-800">Nouvel article</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Titre *</label>
                <Input
                  placeholder="Titre de l'article"
                  value={newArticle.title}
                  onChange={e => setNewArticle({ ...newArticle, title: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Contenu *</label>
                <Textarea
                  placeholder="Contenu de l'article (supporte le markdown)"
                  value={newArticle.content}
                  onChange={e => setNewArticle({ ...newArticle, content: e.target.value })}
                  rows={8}
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Catégorie</label>
                  <Select
                    value={newArticle.category}
                    onValueChange={(value) => setNewArticle({ ...newArticle, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Ordre d'affichage</label>
                  <Input
                    type="number"
                    min={0}
                    value={newArticle.order_index}
                    onChange={e => setNewArticle({ ...newArticle, order_index: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="new-active"
                    checked={newArticle.is_active}
                    onChange={e => setNewArticle({ ...newArticle, is_active: e.target.checked })}
                    className="rounded"
                  />
                  <label htmlFor="new-active" className="text-sm font-medium">
                    Article actif
                  </label>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Image/GIF</label>
                <KBImageUpload onImageChange={e => handleImageUpload(e, false)} imagePreview={imagePreview} />
                {uploading && <Loader2 className="h-4 w-4 animate-spin ml-2 inline" />}
                <p className="text-xs text-gray-500 mt-1">Après upload, le markdown de l'image sera inséré automatiquement dans le contenu.</p>
              </div>
              
              <div className="flex gap-2">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Créer l\'article'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowForm(false)} 
                  disabled={isLoading}
                >
                  <X className="h-4 w-4 mr-2" />
                  Annuler
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Formulaire d'édition */}
      {editing && (
        <Card className="mb-4 border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-800">Éditer l'article</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Titre *</label>
                <Input
                  placeholder="Titre de l'article"
                  value={editing.title}
                  onChange={e => setEditing({ ...editing, title: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Contenu *</label>
                <Textarea
                  placeholder="Contenu de l'article (supporte le markdown)"
                  value={editing.content}
                  onChange={e => setEditing({ ...editing, content: e.target.value })}
                  rows={8}
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Catégorie</label>
                  <Select
                    value={editing.category}
                    onValueChange={(value) => setEditing({ ...editing, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Ordre d'affichage</label>
                  <Input
                    type="number"
                    min={0}
                    value={editing.order_index}
                    onChange={e => setEditing({ ...editing, order_index: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="edit-active"
                    checked={editing.is_active}
                    onChange={e => setEditing({ ...editing, is_active: e.target.checked })}
                    className="rounded"
                  />
                  <label htmlFor="edit-active" className="text-sm font-medium">
                    Article actif
                  </label>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Image/GIF</label>
                <KBImageUpload onImageChange={e => handleImageUpload(e, true)} imagePreview={imagePreview} />
                {uploading && <Loader2 className="h-4 w-4 animate-spin ml-2 inline" />}
                <p className="text-xs text-gray-500 mt-1">Après upload, le markdown de l'image sera inséré automatiquement dans le contenu.</p>
              </div>
              
              <div className="flex gap-2">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Sauvegarder
                    </>
                  )}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setEditing(null)} 
                  disabled={isLoading}
                >
                  <X className="h-4 w-4 mr-2" />
                  Annuler
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Liste des articles */}
      <Card>
        <CardHeader>
          <CardTitle>Articles ({articles.length})</CardTitle>
          <CardDescription>
            Gérez les articles de la base de connaissances affichés aux utilisateurs.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : articles.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">Aucun article trouvé</p>
              <p className="text-sm mt-2">Ajoutez votre premier article pour aider les utilisateurs.</p>
              <Button 
                onClick={() => setShowForm(true)} 
                className="mt-4"
                disabled={isLoading}
              >
                <Plus className="h-4 w-4 mr-2" />
                Créer le premier article
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {articles.map(article => (
                <div key={article.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg truncate">{article.title}</h3>
                        {!article.is_active && (
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <EyeOff className="h-3 w-3" />
                            Inactif
                          </Badge>
                        )}
                        {article.is_active && (
                          <Badge variant="default" className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            Actif
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 mb-2 text-sm text-gray-500">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {CATEGORIES.find(c => c.value === article.category)?.label || article.category}
                        </span>
                        <span>Ordre: {article.order_index}</span>
                        <span>
                          Créé le {new Date(article.created_at).toLocaleDateString('fr-FR')}
                        </span>
                        {article.updated_at !== article.created_at && (
                          <span>
                            • Modifié le {new Date(article.updated_at).toLocaleDateString('fr-FR')}
                          </span>
                        )}
                      </div>
                      
                      <div className="bg-gray-50 rounded p-3 text-sm text-gray-700 max-h-24 overflow-hidden">
                        <div className="line-clamp-3">{article.content}</div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 flex-shrink-0">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => setEditing(article)} 
                        disabled={isLoading}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Modifier
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleToggleActive(article)} 
                        disabled={isLoading}
                      >
                        {article.is_active ? (
                          <>
                            <EyeOff className="h-4 w-4 mr-1" />
                            Désactiver
                          </>
                        ) : (
                          <>
                            <Eye className="h-4 w-4 mr-1" />
                            Activer
                          </>
                        )}
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive" 
                        onClick={() => handleDelete(article.id)} 
                        disabled={isLoading}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Supprimer
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSupportKnowledgeBase; 