import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ReviewsSettingsForm } from "./components/ReviewsSettingsForm";
import { GoogleApiKeysForm } from "./components/GoogleApiKeysForm";
import { useGoogleReviewsForm } from "./hooks/useGoogleReviewsForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface GoogleReviewsSettingsProps {
  isDisabled?: boolean;
}

export function GoogleReviewsSettings({ isDisabled }: GoogleReviewsSettingsProps) {
  const { form } = useGoogleReviewsForm();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Connexion à Google Avis</CardTitle>
        <CardDescription>
          Configurez la connexion à l'API Google My Business pour afficher les avis clients
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="keys" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="keys">Clés API</TabsTrigger>
            <TabsTrigger value="settings">Paramètres</TabsTrigger>
          </TabsList>
          <TabsContent value="keys" className="mt-4">
            <GoogleApiKeysForm />
          </TabsContent>
          <TabsContent value="settings" className="mt-4">
            <ReviewsSettingsForm control={form.control} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
