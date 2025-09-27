import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import { LegalPageType, useLegalPages } from "@/hooks/useLegalPages";

const Privacy = () => {
  const navigate = useNavigate();
  const { fetchPageByType } = useLegalPages();
  const [content, setContent] = useState<string>('<p>Insérez votre politique de confidentialité ici.</p>');
  const [title, setTitle] = useState<string>("Politique de Confidentialité");
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const loadContent = async () => {
      setLoading(true);
      try {
        const page = await fetchPageByType("privacy" as LegalPageType);
        if (page) {
          setContent(page.content);
          setTitle(page.title);
        }
      } catch (error) {
        console.error("Error loading privacy policy:", error);
      } finally {
        setLoading(false);
      }
    };

    loadContent();
  }, [fetchPageByType]);

  return (
    <div className="container mx-auto py-8 px-4">
      <Card>
        <CardHeader className="flex flex-row items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            className="mr-2" 
            onClick={() => navigate("/")}
            aria-label="Retour à l'accueil"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <CardTitle className="text-2xl">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-6 w-1/2 mt-6" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          ) : (
            <div 
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          )}
        </CardContent>
        <CardFooter>
          <Button 
            variant="outline" 
            onClick={() => navigate("/")}
            className="w-full sm:w-auto"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour à l'accueil
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Privacy;
