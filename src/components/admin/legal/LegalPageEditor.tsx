import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { LegalPage, LegalPageType, useLegalPages } from "@/hooks/useLegalPages";

// Importation dynamique de l'éditeur de texte riche pour éviter les problèmes de SSR
const DynamicEditor = React.lazy(() => import("../../../components/ui/rich-text-editor"));

interface LegalPageEditorProps {
  initialType?: LegalPageType;
}

export const LegalPageEditor: React.FC<LegalPageEditorProps> = ({ initialType = "terms" }) => {
  const { pages, loading, saving, updatePage } = useLegalPages();
  const [activeTab, setActiveTab] = useState<LegalPageType>(initialType);
  const [editedPage, setEditedPage] = useState<LegalPage | null>(null);
  const [preview, setPreview] = useState(false);

  // Mettre à jour la page éditée lorsque les pages sont chargées ou que l'onglet actif change
  useEffect(() => {
    if (pages.length > 0) {
      const page = pages.find(p => p.type === activeTab);
      if (page) {
        setEditedPage(page);
      }
    }
  }, [pages, activeTab]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (editedPage) {
      setEditedPage({
        ...editedPage,
        title: e.target.value
      });
    }
  };

  const handleContentChange = (content: string) => {
    if (editedPage) {
      setEditedPage({
        ...editedPage,
        content
      });
    }
  };

  const handleSave = async () => {
    if (editedPage) {
      await updatePage(editedPage);
    }
  };

  const getPageTypeLabel = (type: LegalPageType): string => {
    switch (type) {
      case "terms": return "Conditions Générales";
      case "privacy": return "Politique de Confidentialité";
      case "legal": return "Mentions Légales";
      default: return type;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Chargement...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Gestion des Pages Légales</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as LegalPageType)}>
          <TabsList className="mb-4">
            {pages.map(page => (
              <TabsTrigger key={page.type} value={page.type}>
                {getPageTypeLabel(page.type as LegalPageType)}
              </TabsTrigger>
            ))}
          </TabsList>

          {pages.map(page => (
            <TabsContent key={page.type} value={page.type} className="space-y-4">
              {editedPage && editedPage.type === page.type && (
                <>
                  <div>
                    <Label htmlFor={`title-${page.type}`}>Titre</Label>
                    <Input
                      id={`title-${page.type}`}
                      value={editedPage.title}
                      onChange={handleTitleChange}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <Label htmlFor={`content-${page.type}`}>Contenu</Label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPreview(!preview)}
                      >
                        {preview ? "Éditer" : "Aperçu"}
                      </Button>
                    </div>

                    <div className="min-h-[400px] border rounded-md">
                      {preview ? (
                        <div 
                          className="p-4 prose max-w-none h-full overflow-auto"
                          dangerouslySetInnerHTML={{ __html: editedPage.content }}
                        />
                      ) : (
                        <React.Suspense fallback={<Skeleton className="h-64 w-full" />}>
                          <DynamicEditor
                            value={editedPage.content}
                            onChange={handleContentChange}
                            className="min-h-[400px]"
                          />
                        </React.Suspense>
                      )}
                    </div>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    Dernière mise à jour: {new Date(editedPage.last_updated).toLocaleString('fr-FR')}
                  </div>
                </>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving || !editedPage}
        >
          {saving ? "Enregistrement..." : "Enregistrer les modifications"}
        </Button>
      </CardFooter>
    </Card>
  );
};
