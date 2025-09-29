import { useEffect, useState } from "react";
import { apiClient } from '@/lib/api-client';

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
        console.log("🖼️ Chargement des paramètres homepage depuis l'API...");
        
        const response = await apiClient.get('/homepage-settings');
        
        if (response.success && response.data) {
          console.log("✅ Paramètres homepage chargés depuis l'API:", response.data);
          setSettings(response.data);
        } else {
          console.warn("⚠️ Aucun paramètre homepage trouvé, utilisation des paramètres par défaut");
          
          // Paramètres par défaut si l'API ne retourne rien
          const defaultSettings: HomepageSettings = {
            title: "CoworkMy",
            description: "Plateforme de coworking moderne",
            hero_title: "Bienvenue sur CoworkMy",
            hero_subtitle: "Découvrez nos espaces de coworking",
            hero_background_image: "https://images.unsplash.com/photo-1600508774636-7b9d1a4db91f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80",
            cta_text: "Commencer",
            features_title: "Fonctionnalités",
            features_subtitle: "Découvrez nos services",
            cta_section_title: "Prêt à commencer ?",
            cta_section_subtitle: "Rejoignez-nous dès aujourd'hui",
            cta_secondary_button_text: "En savoir plus",
            is_published: true
          };
          
          setSettings(defaultSettings);
        }
      } catch (error) {
        console.error("❌ Erreur lors du chargement des paramètres homepage:", error);
        
        // En cas d'erreur, utiliser les paramètres par défaut
        const defaultSettings: HomepageSettings = {
          title: "CoworkMy",
          description: "Plateforme de coworking moderne",
          hero_title: "Bienvenue sur CoworkMy",
          hero_subtitle: "Découvrez nos espaces de coworking",
          hero_background_image: "https://images.unsplash.com/photo-1600508774636-7b9d1a4db91f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80",
          cta_text: "Commencer",
          features_title: "Fonctionnalités",
          features_subtitle: "Découvrez nos services",
          cta_section_title: "Prêt à commencer ?",
          cta_section_subtitle: "Rejoignez-nous dès aujourd'hui",
          cta_secondary_button_text: "En savoir plus",
          is_published: true
        };
        
        setSettings(defaultSettings);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSettings();
  }, []);

  return { settings, loading };
} 