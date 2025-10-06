import { useEffect, useState, useCallback } from "react";
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/context/AuthContextPostgreSQL';
import { useUserProfile } from './useUserProfile';
import { logger } from '@/utils/logger';

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
  // Informations de l'entreprise
  company_name?: string;
  company_email?: string;
  company_phone?: string;
  company_address?: string;
  company_website?: string;
  company_description?: string;
  company_logo_url?: string;
  company_siret?: string;
  company_vat_number?: string;
}

export function useHomepageSettings() {
  const [settings, setSettings] = useState<HomepageSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { profile: userProfile } = useUserProfile(user?.id);

  const fetchSettings = useCallback(async () => {
      setLoading(true);
      try {
        logger.debug("🖼️ Chargement des paramètres homepage depuis l'API...");
        
        // Récupérer les paramètres de la page d'accueil
        const homepageResponse = await fetch('http://localhost:5000/api/homepage-settings');
        const homepageData = await homepageResponse.json();
        
        // Récupérer les paramètres de l'entreprise
        const companyResponse = await fetch('http://localhost:5000/api/company-settings');
        const companyData = await companyResponse.json();
        
        if (homepageData.success && homepageData.data) {
          logger.debug("✅ Paramètres homepage chargés depuis l'API:", homepageData.data);
          logger.debug("✅ Paramètres entreprise chargés depuis l'API:", companyData.data);
          
          // Enrichir les paramètres avec les informations du profil utilisateur et de l'entreprise
          const enrichedSettings = {
            ...homepageData.data,
            // Ajouter les informations de l'entreprise
            ...(companyData.success && companyData.data && {
              company_name: companyData.data.name || '',
              company_email: companyData.data.email || '',
              company_phone: companyData.data.phone || '',
              company_address: companyData.data.address || '',
              company_website: companyData.data.website || '',
              company_description: companyData.data.description || '',
              company_logo_url: companyData.data.logo_url || '',
              company_siret: companyData.data.siret || '',
              company_vat_number: companyData.data.vat_number || ''
            }),
            // Ajouter des informations personnalisées si l'utilisateur est connecté
            ...(userProfile && {
              user_name: userProfile.first_name && userProfile.last_name 
                ? `${userProfile.first_name} ${userProfile.last_name}` 
                : userProfile.first_name || 'Utilisateur',
              user_company: userProfile.company || '',
              user_city: userProfile.city || '',
              user_avatar: userProfile.avatar_url || '',
              user_presentation: userProfile.presentation || ''
            })
          };
          
          setSettings(enrichedSettings);
        } else {
          logger.warn("⚠️ Aucun paramètre homepage trouvé, utilisation des paramètres par défaut");
          
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
            is_published: true,
            // Ajouter les informations de l'entreprise par défaut
            ...(companyData.success && companyData.data && {
              company_name: companyData.data.name || 'Votre Entreprise',
              company_email: companyData.data.email || 'contact@votre-entreprise.com',
              company_phone: companyData.data.phone || '+33 1 23 45 67 89',
              company_address: companyData.data.address || '123 Rue de la Paix\n75001 Paris, France',
              company_website: companyData.data.website || 'https://www.votre-entreprise.com',
              company_description: companyData.data.description || 'Une entreprise innovante',
              company_logo_url: companyData.data.logo_url || '',
              company_siret: companyData.data.siret || '',
              company_vat_number: companyData.data.vat_number || ''
            }),
            // Ajouter des informations personnalisées si l'utilisateur est connecté
            ...(userProfile && {
              user_name: userProfile.first_name && userProfile.last_name 
                ? `${userProfile.first_name} ${userProfile.last_name}` 
                : userProfile.first_name || 'Utilisateur',
              user_company: userProfile.company || '',
              user_city: userProfile.city || '',
              user_avatar: userProfile.avatar_url || '',
              user_presentation: userProfile.presentation || ''
            })
          };
          
          setSettings(defaultSettings);
        }
      } catch (error) {
        logger.error("❌ Erreur lors du chargement des paramètres homepage:", error);
        
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
          is_published: true,
          // Informations de l'entreprise par défaut
          company_name: "Votre Entreprise",
          company_email: "contact@votre-entreprise.com",
          company_phone: "+33 1 23 45 67 89",
          company_address: "123 Rue de la Paix\n75001 Paris, France",
          company_website: "https://www.votre-entreprise.com",
          company_description: "Une entreprise innovante",
          company_logo_url: "",
          company_siret: "",
          company_vat_number: ""
        };
        
        setSettings(defaultSettings);
      } finally {
        setLoading(false);
      }
    }, [userProfile]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const refetch = useCallback(() => {
    fetchSettings();
  }, [fetchSettings]);

  return { settings, loading, refetch };
} 