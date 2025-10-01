import { useState, useEffect, useCallback, useRef } from "react";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";

export type LegalPageType = "terms" | "privacy" | "legal";

export interface LegalPage {
  id: string;
  type: LegalPageType;
  title: string;
  content: string;
  last_updated: string;
}

export function useLegalPages() {
  const [pages, setPages] = useState<LegalPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedPage, setSelectedPage] = useState<LegalPage | null>(null);
  
  // 🔧 CORRECTION : Types stricts pour le cache
  const cacheRef = useRef<Partial<Record<LegalPageType, LegalPage>>>({});
  const loadingRef = useRef<Partial<Record<LegalPageType, boolean>>>({});

  const fetchPages = async () => {
    try {
      setLoading(true);
      console.log('🔄 Chargement des pages légales...');
      
      const result = await apiClient.get('/legal-pages');
      const data = result.success ? result.data : null;
      const error = result.success ? null : { message: result.error };

      if (error) {
        console.error('❌ Erreur SQL:', error);
        
        if (error.code === '42P01') {
          console.log('📝 Table legal_pages inexistante, utilisation des données par défaut');
          await createDefaultPages();
          return;
        }
        throw error;
      }

      console.log('✅ Pages légales chargées:', data?.length || 0);
      
      // 🔧 CORRECTION : Vérifier que data est un tableau
      const pagesArray = Array.isArray(data) ? data : [];
      
      if (pagesArray.length === 0) {
        console.log('📝 Aucune page trouvée, création des pages par défaut');
        await createDefaultPages();
        return;
      }
      
      setPages(pagesArray);
      
      // 🔧 CORRECTION : Vérification du type avant l'assignation
      pagesArray.forEach((page: any) => {
        if (page.type && ['terms', 'privacy', 'legal'].includes(page.type)) {
          cacheRef.current[page.type as LegalPageType] = page;
        }
      });
      
    } catch (error) {
      console.error("❌ Erreur lors du chargement des pages légales:", error);
      setPages(getDefaultPages());
      toast.error("Impossible de récupérer les pages légales - utilisation des données par défaut");
    } finally {
      setLoading(false);
    }
  };

  // 🔧 CORRECTION : Gestion stricte des types
  const fetchPageByType = useCallback(async (type: LegalPageType): Promise<LegalPage> => {
    // Si on a déjà la page en cache, la retourner
    if (cacheRef.current[type]) {
      console.log(`✅ Page ${type} trouvée dans le cache`);
      return cacheRef.current[type]!; // ! car on a vérifié l'existence
    }

    // Si un chargement est déjà en cours, attendre
    if (loadingRef.current[type]) {
      console.log(`⏳ Chargement de ${type} déjà en cours, attente...`);
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (!loadingRef.current[type] && cacheRef.current[type]) {
            clearInterval(checkInterval);
            resolve(cacheRef.current[type]!);
          }
        }, 100);
        
        // Timeout après 5 secondes pour éviter l'attente infinie
        setTimeout(() => {
          clearInterval(checkInterval);
          resolve(getDefaultPage(type));
        }, 5000);
      });
    }

    try {
      loadingRef.current[type] = true;
      console.log(`🔍 Recherche de la page ${type}...`);
      
      // Utiliser l'API client au lieu de Supabase
      const result = await apiClient.get('/legal-pages');
      const pages = result.success && Array.isArray(result.data) ? result.data : [];
      
      const page = pages.find((p: any) => p.type === type);
      
      if (!page) {
        console.log(`📝 Page ${type} non trouvée, création...`);
        const newPage = getDefaultPage(type);
        cacheRef.current[type] = newPage;
        return newPage;
      }

      console.log(`✅ Page ${type} trouvée`);
      cacheRef.current[type] = page;
      return page;
    } catch (error) {
      console.error(`❌ Erreur lors du chargement de la page ${type}:`, error);
      const defaultPage = getDefaultPage(type);
      cacheRef.current[type] = defaultPage;
      return defaultPage;
    } finally {
      loadingRef.current[type] = false;
    }
  }, []);

  const updatePage = async (page: LegalPage) => {
    try {
      setSaving(true);
      console.log('💾 Sauvegarde de la page:', page.type);
      
      const updateData = {
        title: page.title,
        content: page.content,
        last_updated: new Date().toISOString()
      };

      // Utiliser l'API client au lieu de Supabase
      const result = await apiClient.put(`/legal-pages/${page.type}`, updateData);

      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de la mise à jour');
      }
      
      console.log('✅ Page sauvegardée avec succès');
      
      const updatedPage = { ...page, last_updated: updateData.last_updated };
      
      // Mettre à jour l'état local et le cache
      setPages(prevPages => 
        prevPages.map(p => p.type === page.type ? updatedPage : p)
      );
      cacheRef.current[page.type] = updatedPage;
      
      toast.success("Page mise à jour avec succès");
      return true;
    } catch (error) {
      console.error("❌ Erreur lors de la mise à jour:", error);
      toast.error("Impossible de mettre à jour la page");
      return false;
    } finally {
      setSaving(false);
    }
  };

  // 🔧 Fonction pour vider le cache
  const clearCache = useCallback(() => {
    cacheRef.current = {};
    loadingRef.current = {};
  }, []);

  const createDefaultPages = async () => {
    try {
      const defaultPagesData = [
        {
          type: 'terms' as LegalPageType,
          title: 'Conditions Générales d\'Utilisation',
          content: '<p>Insérez vos conditions générales ici.</p>',
          last_updated: new Date().toISOString()
        },
        {
          type: 'privacy' as LegalPageType,
          title: 'Politique de Confidentialité',
          content: '<p>Insérez votre politique de confidentialité ici.</p>',
          last_updated: new Date().toISOString()
        },
        {
          type: 'legal' as LegalPageType,
          title: 'Mentions Légales',
          content: '<p>Insérez vos mentions légales ici.</p>',
          last_updated: new Date().toISOString()
        }
      ];

      // Utiliser l'API client au lieu de Supabase
      const result = await apiClient.post('/legal-pages', defaultPagesData);

      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de la création');
      }
      
      console.log('✅ Pages par défaut créées');
      const pagesData = Array.isArray(result.data) ? result.data : [];
      setPages(pagesData);
      
      // 🔧 CORRECTION : Vérification du type avant l'assignation
      pagesData.forEach((page: any) => {
        if (page.type && ['terms', 'privacy', 'legal'].includes(page.type)) {
          cacheRef.current[page.type as LegalPageType] = page;
        }
      });
    } catch (error) {
      console.error('❌ Erreur création pages par défaut:', error);
      const defaultPages = getDefaultPages();
      setPages(defaultPages);
      defaultPages.forEach(page => {
        cacheRef.current[page.type] = page;
      });
    }
  };

  const createDefaultPage = async (type: LegalPageType): Promise<LegalPage> => {
    try {
      const defaultPage = getDefaultPage(type);
      
      // Utiliser l'API client au lieu de Supabase
      const result = await apiClient.post('/legal-pages', [{
        type: defaultPage.type,
        title: defaultPage.title,
        content: defaultPage.content,
        last_updated: new Date().toISOString()
      }]);

      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de la création');
      }
      
      console.log(`✅ Page ${type} créée`);
      const pagesData = Array.isArray(result.data) ? result.data : [];
      return pagesData[0] || defaultPage;
    } catch (error) {
      console.error(`❌ Erreur création page ${type}:`, error);
      return getDefaultPage(type);
    }
  };

  const getDefaultPages = (): LegalPage[] => [
    {
      id: '1',
      type: 'terms',
      title: 'Conditions Générales d\'Utilisation',
      content: '<p>Insérez vos conditions générales ici.</p>',
      last_updated: new Date().toISOString()
    },
    {
      id: '2',
      type: 'privacy',
      title: 'Politique de Confidentialité',
      content: '<p>Insérez votre politique de confidentialité ici.</p>',
      last_updated: new Date().toISOString()
    },
    {
      id: '3',
      type: 'legal',
      title: 'Mentions Légales',
      content: '<p>Insérez vos mentions légales ici.</p>',
      last_updated: new Date().toISOString()
    }
  ];

  const getDefaultPage = (type: LegalPageType): LegalPage => {
    const defaultContent: Record<LegalPageType, string> = {
      terms: '<p>Insérez vos conditions générales ici.</p>',
      privacy: '<p>Insérez votre politique de confidentialité ici.</p>',
      legal: '<p>Insérez vos mentions légales ici.</p>'
    };
    
    const defaultTitle: Record<LegalPageType, string> = {
      terms: 'Conditions Générales d\'Utilisation',
      privacy: 'Politique de Confidentialité',
      legal: 'Mentions Légales'
    };
    
    return {
      id: type,
      type,
      title: defaultTitle[type],
      content: defaultContent[type],
      last_updated: new Date().toISOString()
    };
  };

  useEffect(() => {
    fetchPages();
  }, []);

  return {
    pages,
    loading,
    saving,
    selectedPage,
    setSelectedPage,
    fetchPages,
    fetchPageByType,
    updatePage,
    clearCache
  };
}
