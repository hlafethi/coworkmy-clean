import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
// Logger supprimé - utilisation de console directement
export interface AppSettings {
  siteName: string;
  contactEmail: string;
  phoneNumber: string | null;
  heroTitle: string;
  heroSubtitle: string;
  heroBackgroundImage: string | null;
  ctaText: string;
  featuresTitle: string;
  featuresSubtitle: string;
  ctaSectionTitle: string;
  ctaSectionSubtitle: string;
  ctaSecondaryButtonText: string;
  workspace_title: string;
  workspace_subtitle: string;
}

export function useAppSettings() {
  return useQuery<AppSettings>({
    queryKey: ["app-settings"],
    queryFn: async () => {
      // Récupérer les paramètres homepage depuis la table admin_settings
      const { data, error } = await supabase
        .from('admin_settings')
        .select('key, value')
        .eq('key', 'homepage')
        .maybeSingle();

      if (error) {
        console.error('Erreur lors du chargement des paramètres:', error);
        throw error;
      }

      console.log('📊 Paramètres récupérés depuis la DB:', data);

      // Extraire les valeurs du JSONB homepage
      const homepageSettings = data?.value || {};

      console.log('✅ Paramètres traités:', homepageSettings);

      // Retourner l'objet avec les valeurs de la DB ou les valeurs par défaut
      return {
        siteName: homepageSettings.title || "CoworkSpace",
        contactEmail: homepageSettings.contact_email || "contact@coworkspace.fr",
        phoneNumber: homepageSettings.phone_number || "+33 1 23 45 67 89",
        heroTitle: homepageSettings.hero_title || "Votre espace de travail idéal à Paris",
        heroSubtitle: homepageSettings.hero_subtitle || "Des espaces de coworking modernes et inspirants pour les freelances, entrepreneurs et équipes qui veulent travailler dans un environnement stimulant et connecté.",
        heroBackgroundImage: homepageSettings.hero_background_image || null,
        ctaText: homepageSettings.cta_text || "Commencer",
        featuresTitle: homepageSettings.features_title || "Pourquoi choisir CoWorkMy ?",
        featuresSubtitle: homepageSettings.features_subtitle || "Nous offrons bien plus qu'un simple espace de travail. Découvrez nos avantages exclusifs qui font de nous le choix idéal pour les professionnels exigeants.",
        ctaSectionTitle: homepageSettings.cta_section_title || "Prêt à rejoindre notre communauté ?",
        ctaSectionSubtitle: homepageSettings.cta_section_subtitle || "Inscrivez-vous dès aujourd'hui et commencez à profiter de tous les avantages",
        ctaSecondaryButtonText: homepageSettings.cta_secondary_button_text || "Réserver une visite",
        workspace_title: homepageSettings.workspace_title || "Nos espaces de travail",
        workspace_subtitle: homepageSettings.workspace_subtitle || "Découvrez nos espaces de coworking et leurs tarifs adaptés à vos besoins"
      };
    },
    staleTime: 1000 * 30, // 30 secondes
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
}
