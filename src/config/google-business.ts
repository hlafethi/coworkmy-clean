import { supabase } from '@/lib/supabase';
// Logger supprimé - utilisation de console directement
export interface GoogleBusinessConfig {
  place_id: string;
  min_rating: number;
  max_reviews: number;
  is_active: boolean;
}

const DEFAULT_CONFIG: GoogleBusinessConfig = {
  place_id: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
  min_rating: 4,
  max_reviews: 5,
  is_active: true
};

export async function getGoogleBusinessConfig(): Promise<GoogleBusinessConfig> {
  try {
    const { data, error } = await supabase
      .from('google_business_config')
      .select('*')
      .single();

    if (error) {
      console.warn('Erreur lors de la récupération de la configuration Google Business:', error);
      return DEFAULT_CONFIG;
    }

    return data || DEFAULT_CONFIG;
  } catch (error) {
    console.error('Erreur lors de la récupération de la configuration Google Business:', error);
    return DEFAULT_CONFIG;
  }
}

export async function updateGoogleBusinessConfig(config: Partial<GoogleBusinessConfig>): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('google_business_config')
      .upsert(config);

    if (error) {
      console.error('Erreur lors de la mise à jour de la configuration Google Business:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la configuration Google Business:', error);
    return false;
  }
} 