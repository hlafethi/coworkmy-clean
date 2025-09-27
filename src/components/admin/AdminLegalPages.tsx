import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LegalPageEditor } from "./legal/LegalPageEditor";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const AdminLegalPages = () => {
  // Afficher les instructions pour exécuter la migration
  const showMigrationInstructions = () => {
    toast.info(
      "Pour créer la table legal_pages, vous devez exécuter la migration manuellement. " +
      "Consultez le fichier supabase/migrations/20250510000000_add_legal_pages.sql pour plus d'informations.",
      { duration: 10000 }
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Pages légales</CardTitle>
          <CardDescription>
            Gérez les pages légales de votre site (conditions générales, politique de confidentialité, mentions légales)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {false && ( // Désactivé car nous supposons que la table existe
            <Alert className="mb-6" variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Table manquante</AlertTitle>
              <AlertDescription className="flex flex-col gap-4">
                <p>
                  La table "legal_pages" n'existe pas encore dans la base de données. 
                  Les modifications que vous apporterez seront temporaires jusqu'à ce que la table soit créée.
                </p>
                <div className="flex flex-col gap-2">
                  <p className="text-sm text-muted-foreground">
                    Pour créer la table, vous devez exécuter la migration manuellement en utilisant l'interface d'administration de Supabase ou en exécutant la commande suivante :
                  </p>
                  <code className="bg-muted p-2 rounded text-sm">
                    supabase db push
                  </code>
                  <Button 
                    onClick={showMigrationInstructions} 
                    variant="outline" 
                    size="sm"
                    className="w-fit"
                  >
                    Plus d'informations
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Information importante</AlertTitle>
            <AlertDescription>
              Ces pages seront accessibles aux utilisateurs depuis le pied de page du site. 
              Assurez-vous que leur contenu est conforme à la législation en vigueur.
            </AlertDescription>
          </Alert>
          
          <LegalPageEditor />
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLegalPages;
