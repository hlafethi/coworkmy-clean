// @ts-nocheck
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { AdminSettingsService } from "@/integrations/postgres/services";
import { AdminSettings } from "@/integrations/postgres/types";
import { usePostgresAuth } from "./usePostgresAuth";
import { SettingsFormValues } from "@/types/settings";
import { logger } from '@/utils/logger';

// Schéma de validation pour les paramètres d'administration
export const settingsFormSchema = z.object({
  homepage: z.object({
    title: z.string().min(1, "Le titre est requis"),
    description: z.string().min(1, "La description est requise"),
    hero_title: z.string().min(1, "Le titre de la page d'accueil est requis"),
    hero_subtitle: z.string().min(1, "Le sous-titre de la page d'accueil est requis"),
    hero_background_image: z.string().url("L'URL de l'image n'est pas valide"),
    cta_text: z.string().min(1, "Le texte du CTA est requis"),
    features_title: z.string().min(1, "Le titre des fonctionnalités est requis"),
    features_subtitle: z.string().min(1, "Le sous-titre des fonctionnalités est requis"),
    cta_section_title: z.string().min(1, "Le titre de la section CTA est requis"),
    cta_section_subtitle: z.string().min(1, "Le sous-titre de la section CTA est requis"),
    cta_secondary_button_text: z.string().min(1, "Le texte du bouton secondaire est requis"),
    is_published: z.boolean().default(false),
  }),
  stripe: z.object({
    mode: z.enum(['test', 'live']),
    test_publishable_key: z.string().min(1, "La clé publique de test est requise"),
    test_secret_key: z.string().min(1, "La clé secrète de test est requise"),
    webhook_secret: z.string().min(1, "Le secret webhook est requis"),
    live_publishable_key: z.string().min(1, "La clé publique de production est requise"),
    live_secret_key: z.string().min(1, "La clé secrète de production est requise"),
    live_webhook_secret: z.string().min(1, "Le secret webhook de production est requis"),
  }).optional(),
});

/**
 * Hook pour gérer les paramètres d'administration avec PostgreSQL
 */
export function usePostgresAdminSettings() {
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { user, isAdmin } = usePostgresAuth();

  // Initialiser le formulaire avec des valeurs par défaut
  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: {
      homepage: {
        title: "",
        description: "",
        hero_title: "",
        hero_subtitle: "",
        hero_background_image: "",
        cta_text: "",
        features_title: "",
        features_subtitle: "",
        cta_section_title: "",
        cta_section_subtitle: "",
        cta_secondary_button_text: "",
        is_published: false,
      },
      stripe: {
        mode: 'test',
        test_publishable_key: '',
        test_secret_key: '',
        webhook_secret: '',
        live_publishable_key: '',
        live_secret_key: '',
        live_webhook_secret: '',
      }
    }
  });

  /**
   * Récupérer les paramètres d'administration
   */
  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await AdminSettingsService.get();
      setSettings(data);

      if (data) {
        form.reset(data);
      }
    } catch (err) {
      logger.error("Erreur lors de la récupération des paramètres d'administration:", err);
      setError(err as Error);
      toast.error("Impossible de charger les paramètres");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Mettre à jour les paramètres d'administration
   * @param updatedSettings Paramètres mis à jour
   */
  const updateSettings = async (updatedSettings: Partial<AdminSettings>) => {
    try {
      setLoading(true);
      setError(null);

      if (!settings?.id) {
        throw new Error("Aucun paramètre d'administration trouvé");
      }

      const data = await AdminSettingsService.update(updatedSettings);
      setSettings(data);
      return { success: true, data };
    } catch (err) {
      logger.error("Erreur lors de la mise à jour des paramètres d'administration:", err);
      setError(err as Error);
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Mettre à jour les clés API Stripe
   * @param mode Mode Stripe (test ou live)
   * @param testPublishableKey Clé publique de test
   * @param testSecretKey Clé secrète de test
   * @param testWebhookSecret Secret webhook de test
   * @param livePublishableKey Clé publique de production
   * @param liveSecretKey Clé secrète de production
   * @param liveWebhookSecret Secret webhook de production
   */
  const updateStripeKeys = async (
    mode: 'test' | 'live',
    testPublishableKey: string,
    testSecretKey: string,
    testWebhookSecret: string,
    livePublishableKey: string,
    liveSecretKey: string,
    liveWebhookSecret: string
  ) => {
    try {
      const result = await updateSettings({
        stripe_mode: mode,
        stripe_test_publishable_key: testPublishableKey,
        stripe_test_secret_key: testSecretKey,
        stripe_webhook_secret: testWebhookSecret,
        stripe_live_publishable_key: livePublishableKey,
        stripe_live_secret_key: liveSecretKey,
        stripe_live_webhook_secret: liveWebhookSecret
      });

      if (result.success) {
        toast.success("Les clés API Stripe ont été mises à jour avec succès");
        return true;
      } else {
        toast.error("Erreur lors de la mise à jour des clés API Stripe");
        return false;
      }
    } catch (err) {
      logger.error("Erreur lors de la mise à jour des clés API Stripe:", err);
      toast.error("Erreur lors de la mise à jour des clés API Stripe");
      return false;
    }
  };

  /**
   * Charger les paramètres d'administration
   */
  const loadSettings = async () => {
    await fetchSettings();
  };

  /**
   * Enregistrer les paramètres d'administration
   * @param values Valeurs du formulaire
   */
  const saveSettings = async (values: SettingsFormValues) => {
    try {
      setIsSaving(true);
      const result = await updateSettings(values);
      if (result.success) {
        toast.success("Paramètres enregistrés avec succès");
      } else {
        toast.error("Erreur lors de l'enregistrement des paramètres");
      }
    } catch (error) {
      logger.error("Erreur lors de la sauvegarde des paramètres:", error);
      toast.error("Erreur lors de l'enregistrement des paramètres");
    } finally {
      setIsSaving(false);
    }
  };

  // Récupérer les paramètres d'administration au chargement du composant
  useEffect(() => {
    fetchSettings();
  }, []);

  return {
    settings,
    isLoading: loading,
    error,
    isAdmin,
    isSaving,
    form,
    loadSettings,
    saveSettings,
    updateStripeKeys
  };
}
