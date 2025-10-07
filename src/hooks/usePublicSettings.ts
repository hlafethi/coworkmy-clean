// hooks/usePublicSettings.ts
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
// Logger supprimé - utilisation de console directement
export interface PublicSettings {
  site_name?: string;
  hero_title?: string;
  hero_subtitle?: string;
  cta_text?: string;
  features_title?: string;
  features_subtitle?: string;
  workspace_title?: string;
  contact_email?: string;
  phone_number?: string;
}

export const usePublicSettings = () => {
  const [settings, setSettings] = useState<PublicSettings>({});
  const [loading, setLoading] = useState(true);

  const loadSettings = async () => {
    try {
      setLoading(true);
      
      // Récupérer les paramètres publics (pas besoin d'être admin)
      const { data, error } = await supabase
        .from('admin_settings')
        .select('setting_key, value');

      if (error) {
        console.error('Erreur lors du chargement des paramètres:', error);
        return;
      }

      if (data) {
        // Convertir en objet
        const settingsObject: PublicSettings = {};
        data.forEach(setting => {
          settingsObject[setting.setting_key as keyof PublicSettings] = setting.value;
        });
        
        setSettings(settingsObject);
      }
    } catch (err) {
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  return { settings, loading, reload: loadSettings };
};
