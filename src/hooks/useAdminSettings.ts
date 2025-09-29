import { useForm } from "react-hook-form";
import { useState } from "react";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import type { SettingsFormValues } from "@/types/settings";

export function useAdminSettings() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const form = useForm<SettingsFormValues>({
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
      },
      google_reviews: {
        api_key: '',
        place_id: '',
        max_reviews: 10,
        min_rating: 4,
      }
    },
  });

  // Toujours utiliser la ligne unique 'homepage', 'stripe' et 'google_reviews' pour les settings
  const SETTINGS_KEYS = ['homepage', 'stripe', 'google_reviews'];

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      // Vérifier si l'utilisateur est admin via l'API
      const userResult = await apiClient.getCurrentUser();
      if (userResult.success && userResult.data && userResult.data.user) {
        setIsAdmin(userResult.data.user.is_admin || false);
      }
      
      // Charger les settings homepage, stripe et google_reviews via l'API
      const settingsResult = await apiClient.get('/admin/settings');
      
      if (settingsResult.success && settingsResult.data) {
        // Fusionner les settings dans le form
        const homepage = settingsResult.data.find((row: any) => row.key === 'homepage')?.value || {};
        const stripe = settingsResult.data.find((row: any) => row.key === 'stripe')?.value || {};
        const googleReviews = settingsResult.data.find((row: any) => row.key === 'google_reviews')?.value || {};
        
        form.reset({
        homepage: {
          title: homepage.title || "",
          description: homepage.description || "",
          hero_title: homepage.hero_title || "",
          hero_subtitle: homepage.hero_subtitle || "",
          hero_background_image: homepage.hero_background_image || "",
          cta_text: homepage.cta_text || "",
          features_title: homepage.features_title || "",
          features_subtitle: homepage.features_subtitle || "",
          cta_section_title: homepage.cta_section_title || "",
          cta_section_subtitle: homepage.cta_section_subtitle || "",
          cta_secondary_button_text: homepage.cta_secondary_button_text || "",
          is_published: homepage.is_published || false,
        },
        stripe: {
          mode: stripe.mode || 'test',
          test_publishable_key: stripe.test_publishable_key || '',
          test_secret_key: stripe.test_secret_key || '',
          webhook_secret: stripe.webhook_secret || '',
          live_publishable_key: stripe.live_publishable_key || '',
          live_secret_key: stripe.live_secret_key || '',
          live_webhook_secret: stripe.live_webhook_secret || '',
        },
        google_reviews: {
          api_key: googleReviews.api_key || '',
          place_id: googleReviews.place_id || '',
          max_reviews: googleReviews.max_reviews || 10,
          min_rating: googleReviews.min_rating || 4,
        }
      });
      }
    } catch (error) {
      console.error("Erreur lors du chargement des paramètres:", error);
      toast.error("Impossible de charger les paramètres");
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async (values: SettingsFormValues) => {
    try {
      setIsSaving(true);
      
      // Préparer les données pour l'upsert
      const settingsToUpsert = [
        {
          key: 'homepage',
          value: values.homepage
        },
        {
          key: 'stripe',
          value: values.stripe
        },
        {
          key: 'google_reviews',
          value: values.google_reviews
        }
      ];

      console.log('[ADMIN_SETTINGS UPSERT]', settingsToUpsert);

      // Sauvegarder les paramètres homepage via l'endpoint spécifique
      if (values.homepage) {
        const homepageResult = await apiClient.post('/homepage-settings', values.homepage);
        if (!homepageResult.success) {
          console.error('[HOMEPAGE_SETTINGS SAVE ERROR]', homepageResult.error);
          throw new Error(homepageResult.error || 'Erreur lors de la sauvegarde des paramètres homepage');
        }
        console.log("✅ Paramètres homepage sauvegardés:", homepageResult.data);
      }

      // Sauvegarder les autres paramètres via l'API générale
      const otherSettings = settingsToUpsert.filter(s => s.key !== 'homepage');
      for (const setting of otherSettings) {
        const result = await apiClient.post('/admin/settings', {
          key: setting.key,
          value: setting.value
        });
        
        if (!result.success) {
          console.error('[ADMIN_SETTINGS SAVE ERROR]', result.error);
          throw new Error(result.error || 'Erreur lors de la sauvegarde');
        }
      }

      toast.success("Paramètres enregistrés avec succès");
    } catch (error) {
      console.error("Erreur lors de la sauvegarde des paramètres:", error);
      toast.error("Erreur lors de l'enregistrement des paramètres");
    } finally {
      setIsSaving(false);
    }
  };

  return {
    form,
    isLoading,
    isSaving,
    isAdmin,
    loadSettings,
    saveSettings,
  };
}

// Pour la base de données, exécute ce SQL si besoin :
// ALTER TABLE admin_settings ADD COLUMN IF NOT EXISTS key text UNIQUE; 