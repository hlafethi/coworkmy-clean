import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface HomepageSettings {
  title?: string;
  description?: string;
  hero_title?: string;
  hero_subtitle?: string;
  hero_background_image?: string;
  cta_text?: string;
  features_title?: string;
  features_subtitle?: string;
  cta_section_title?: string;
  cta_section_subtitle?: string;
  cta_secondary_button_text?: string;
  is_published?: boolean;
}

export function useHomepageSettings() {
  const [settings, setSettings] = useState<HomepageSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("admin_settings")
          .select("key, value")
          .eq("key", "homepage")
          .maybeSingle();
        
        if (error) {
          console.error("Erreur lors du chargement des paramètres homepage:", error);
        }
        
        // Extraire les valeurs du JSONB value
        const homepageSettings = data?.value || {};
        
        console.log("🖼️ Paramètres homepage chargés:", homepageSettings);
        
        setSettings(homepageSettings);
      } catch (error) {
        console.error("Erreur lors du chargement des paramètres:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSettings();
  }, []);

  return { settings, loading };
} 