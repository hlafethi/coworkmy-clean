import {
  Form,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { UseFormReturn } from "react-hook-form";
import { SettingsFormValues } from "@/types/settings";

import { CarouselImageManager } from "./CarouselImageManager";
import { GoogleReviewsSettings } from "./google-reviews/GoogleReviewsSettings";
import { DatabaseSelector } from "../DatabaseSelector";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminWarningMessage } from "./tabs/AdminWarningMessage";
import { GeneralSettingsTab } from "./tabs/GeneralSettingsTab";
import { HomepageSettingsTab } from "./tabs/HomepageSettingsTab";

interface SettingsFormProps {
  form: UseFormReturn<SettingsFormValues>;
  onSubmit: (data: SettingsFormValues) => void;
  isSaving: boolean;
  isDisabled?: boolean;
}

export function SettingsForm({ form, onSubmit, isSaving, isDisabled = false }: SettingsFormProps) {
  return (
    <Tabs defaultValue="general">
      <TabsList className="mb-6">
        <TabsTrigger value="general">Général</TabsTrigger>
        <TabsTrigger value="homepage">Page d'accueil</TabsTrigger>
        <TabsTrigger value="carousel">Carrousel</TabsTrigger>
        <TabsTrigger value="google-reviews">Avis Google</TabsTrigger>
        <TabsTrigger value="database">Base de données</TabsTrigger>
      </TabsList>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <AdminWarningMessage isDisabled={isDisabled} />

          <div className="space-y-6">
            <TabsContent value="carousel">
              <div>
                <h3 className="text-lg font-medium">Images du carrousel</h3>
                <p className="text-sm text-muted-foreground">
                  Gérez les images qui apparaissent dans le carrousel de la page d'accueil.
                </p>
              </div>

              <CarouselImageManager />
            </TabsContent>

            <TabsContent value="general">
              <GeneralSettingsTab
                form={form}
                isDisabled={isDisabled}
              />
            </TabsContent>

            <TabsContent value="homepage">
              <HomepageSettingsTab
                form={form}
                isDisabled={isDisabled}
              />
            </TabsContent>

            <TabsContent value="google-reviews">
              <GoogleReviewsSettings isDisabled={isDisabled} />
            </TabsContent>

            <TabsContent value="database">
              <div>
                <h3 className="text-lg font-medium">Configuration de la base de données</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Gérez vos bases de données et migrez vos données entre Supabase, O2Switch et MySQL.
                </p>
                <DatabaseSelector />
              </div>
            </TabsContent>
          </div>

          <Button
            type="submit"
            disabled={isSaving || isDisabled}
            className="mt-4 px-6 w-full sm:w-auto"
          >
            {isSaving ? "Enregistrement..." : "Enregistrer les modifications"}
          </Button>

          {isDisabled && (
            <div className="text-xs text-muted-foreground mt-2">
              Contactez un administrateur pour obtenir les droits nécessaires.
            </div>
          )}
        </form>
      </Form>
    </Tabs>
  );
}
