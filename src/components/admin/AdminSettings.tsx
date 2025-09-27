import { useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { useAdminSettings } from "@/hooks/useAdminSettings";
import { SettingsForm } from "./settings/SettingsForm";
import { Settings, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const AdminSettings = () => {
  const { form, isLoading, isSaving, isAdmin, loadSettings, saveSettings } = useAdminSettings();

  useEffect(() => {
    loadSettings();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        Chargement des paramètres...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Settings className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Paramètres de l'administration</h2>
        </div>
        {isAdmin && (
          <Badge variant="outline" className="flex items-center gap-1 bg-green-50 text-green-700 border-green-200 px-3 py-1">
            <ShieldCheck className="h-4 w-4" />
            Administrateur
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres généraux</CardTitle>
              <CardDescription>Configuration de la plateforme</CardDescription>
            </CardHeader>
            <CardContent>
              <SettingsForm
                form={form}
                onSubmit={saveSettings}
                isSaving={isSaving}
                isDisabled={false}
              />
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Aide</CardTitle>
              <CardDescription>Guide de configuration</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Les paramètres définis ici seront utilisés dans toute l'application.
                Assurez-vous que les informations sont correctes car elles seront
                visibles par les utilisateurs.
              </p>
              {isAdmin && (
                <div className="mt-2 p-2 bg-blue-50 rounded-md text-sm text-blue-700 border border-blue-100">
                  <p className="font-medium">Statut Administrateur</p>
                  <p className="mt-1">
                    Vous disposez de tous les droits nécessaires pour modifier les paramètres du site.
                  </p>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <p className="text-xs text-muted-foreground">
                Dernière mise à jour : {new Date().toLocaleDateString()}
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
