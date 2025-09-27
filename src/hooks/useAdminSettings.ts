import { useForm } from "react-hook-form";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
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
      // Vérifier si l'utilisateur est admin
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', user.id)
          .maybeSingle();
        if (profileError) {
          console.error("Erreur lors de la vérification des droits admin:", profileError);
        } else {
          setIsAdmin(profile?.is_admin || false);
        }
      }
      
      // Charger les settings homepage, stripe et google_reviews
      const { data: settingsRows, error: settingsError } = await supabase
        .from('admin_settings')
        .select('*')
        .in('key', SETTINGS_KEYS);
      
      if (settingsError) {
        console.error("Erreur lors du chargement des paramètres:", settingsError);
        throw settingsError;
      }
      
      // Fusionner les settings dans le form
      const homepage = settingsRows?.find((row: any) => row.key === 'homepage')?.value || {};
      const stripe = settingsRows?.find((row: any) => row.key === 'stripe')?.value || {};
      const googleReviews = settingsRows?.find((row: any) => row.key === 'google_reviews')?.value || {};
      
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

      // Upsert tous les paramètres en une seule fois
      const { error } = await supabase
        .from('admin_settings')
        .upsert(settingsToUpsert, { onConflict: 'key' });

      if (error) {
        console.error('[ADMIN_SETTINGS UPSERT ERROR]', error);
        throw error;
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