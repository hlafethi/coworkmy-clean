import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription, Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { EmailFormLayout } from "./forms/EmailFormLayout";
import { useEmailConfig } from "./hooks/useEmailConfig";
import { useState } from "react";

const SUPABASE_FUNCTIONS_URL = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL || "https://exffryodynkyizbeesbt.functions.supabase.co";

export const EmailConfigForm = () => {
  const { form, isLoading, isSubmitting, configExists, saveConfig } = useEmailConfig();
  const [testStatus, setTestStatus] = useState<string | null>(null);
  const [testLoading, setTestLoading] = useState(false);

  const handleTestSMTP = async () => {
    setTestStatus(null);
    setTestLoading(true);
    try {
      const values = form.getValues();
      const to = values.from_email;
      // TODO: remplacer par l'appel au backend Express /api/send-email une fois en place
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          to,
          subject: "Test SMTP - Coworking",
          html: `<b>Ceci est un test SMTP depuis Coworking</b><br>Expéditeur : ${to}`
        })
      });
      let data: any = {};
      try {
        data = await response.json();
      } catch {
        // Ignore parse error if not JSON
      }
      if (!response.ok) {
        setTestStatus(`❌ Erreur lors de l'envoi : ${data.error || response.statusText} (code ${response.status})`);
        return;
      }
      if (data.success) {
        setTestStatus("✅ Email de test envoyé avec succès !");
      } else {
        setTestStatus(`❌ Erreur lors de l'envoi : ${data.error || response.statusText}`);
      }
    } catch (err: any) {
      setTestStatus(`❌ Erreur lors de l'envoi : ${err.message}`);
    } finally {
      setTestLoading(false);
    }
  };

  if (isLoading) {
    return <div>Chargement de la configuration...</div>;
  }

  return (
    <>
      <EmailFormLayout
        description="Cette configuration sera utilisée pour envoyer des emails depuis l'application. Assurez-vous que les informations SMTP sont correctes."
        isSubmitting={isSubmitting}
        submitLabel={configExists ? "Mettre à jour" : "Enregistrer"}
        onSubmit={form.handleSubmit(saveConfig)}
        footer={
          <>
            <button
              type="button"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              onClick={handleTestSMTP}
              disabled={testLoading}
            >
              {testLoading ? "Test en cours..." : "Tester la connexion SMTP"}
            </button>
            {testStatus && <div className="mt-2 text-sm">{testStatus}</div>}
          </>
        }
      >
        <Form {...form}>
          <FormField
            control={form.control}
            name="host"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Serveur SMTP</FormLabel>
                <FormControl>
                  <Input placeholder="smtp.example.com" {...field} />
                </FormControl>
                <FormDescription>
                  Le nom d'hôte ou l'adresse IP du serveur SMTP.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="port"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Port SMTP</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="587" {...field} />
                </FormControl>
                <FormDescription>
                  Le port du serveur SMTP (généralement 25, 465 ou 587).
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nom d'utilisateur</FormLabel>
                <FormControl>
                  <Input placeholder="utilisateur@exemple.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mot de passe</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="••••••••" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="from_email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email d'expédition</FormLabel>
                <FormControl>
                  <Input placeholder="no-reply@exemple.com" {...field} />
                </FormControl>
                <FormDescription>
                  L'adresse qui apparaîtra comme expéditeur des emails.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </Form>
      </EmailFormLayout>
    </>
  );
};
