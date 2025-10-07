// @ts-nocheck
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { handleApiResponse } from '@/utils/supabaseUtils';
// Logger supprimé - utilisation de console directement
export interface GoogleApiSettings {
  place_id: string;  // Requis, pas optionnel
  min_rating: number;  // Requis, pas optionnel
  max_reviews: number;  // Requis, pas optionnel
}

export interface GoogleReviewsResponse {
  reviews: Array<{
    author: string;
    rating: number;
    text: string;
    time: number;
    profile_photo_url: string;
  }>;
  place_name?: string;
  overall_rating?: number;
  total_ratings?: number;
}

export interface GoogleReviewsData {
  place_name: string;
  overall_rating: number;
  total_ratings: number;
  reviews: Array<{
    author: string;
    rating: number;
    text: string;
    time: number;
    profile_photo_url: string;
  }>;
}

interface GoogleReview {
  author_name: string;
  rating: number;
  text: string;
  time: number;
  profile_photo_url: string;
}

interface GoogleReviewsResponse {
  result: {
    reviews: GoogleReview[];
  };
  status: string;
}

const fetchGoogleReviews = async (): Promise<GoogleReview[]> => {
  if (import.meta.env.DEV) {
    console.log('🔄 Mode développement: Google Reviews désactivé');
    return [];
  }

  try {
    // Récupération des clés API
    const { data: keys, error: keysError } = await supabase
      .from('google_api_keys')
      .select('api_key, place_id')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (keysError) {
      console.error('Erreur lors de la récupération des clés:', keysError);
      throw new Error('Configuration Google Business non trouvée');
    }

    if (!keys || !keys.api_key || !keys.place_id) {
      throw new Error('Clés API Google non configurées');
    }

    // Utilisation de l'Edge Function Supabase
    const { data, error } = await supabase.functions.invoke('get-google-reviews', {
      body: {
        placeId: keys.place_id,
        apiKey: keys.api_key
      }
    });

    if (error) {
      console.error('Erreur Edge Function:', error);
      throw new Error(`Erreur serveur: ${error.message}`);
    }

    if (!data || data.status !== 'OK') {
      console.error('Erreur Google Places:', {
        status: data?.status,
        error_message: data?.error_message,
        placeId: keys.place_id
      });
      throw new Error(`Erreur Google Places: ${data?.status}${data?.error_message ? ` - ${data.error_message}` : ''}`);
    }

    return data.result.reviews;
  } catch (error) {
    console.error('Erreur lors de la récupération des avis:', error);
    throw error;
  }
};

export const useGoogleReviews = () => {
  return useQuery({
    queryKey: ['googleReviews'],
    queryFn: fetchGoogleReviews,
    retry: 2,
    staleTime: 1000 * 60 * 60, // 1 heure
    refetchOnWindowFocus: false
  });
};

export function useTestGoogleApiConnection(placeId: string) {
  const testConnection = async () => {
    try {
      const { data, error } = await supabase.functions.invoke<GoogleReviewsResponse>("get-google-reviews", {
        body: {
          action: "test_connection",
          placeId
        }
      });
      
      if (error) throw error;
      return { success: true, data };
    } catch (error: any) {
      console.error("Connection test failed:", error);
      return { success: false, error: error.message || "Failed to connect to Google Places API" };
    }
  };
  
  return { testConnection };
}

export function useGoogleApiSettings() {
  return useQuery<GoogleApiSettings | null>({
    queryKey: ["google-api-settings"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("google_api_settings")
          .select("*")
          .maybeSingle();
          
        if (error) {
          console.error("Error fetching Google API settings:", error);
          throw error;
        }
        
        if (!data) {
          console.warn("No Google API settings found in database");
          return null;
        }
        
        return {
          place_id: data.place_id,
          min_rating: data.min_rating || 4,
          max_reviews: data.max_reviews || 5
        };
      } catch (error) {
        console.error("Failed to fetch Google API settings:", error);
        throw error;
      }
    }
  });
}

export function useSaveGoogleApiSettings() {
  const saveSettings = async (settings: GoogleApiSettings) => {
    try {
      // Check if settings record exists
      const { data: existingSettings } = await supabase
        .from("google_api_settings")
        .select("id")
        .maybeSingle();
      
      let result;
      
      if (existingSettings?.id) {
        // Update existing record
        result = await supabase
          .from("google_api_settings")
          .update({
            place_id: settings.place_id,
            min_rating: settings.min_rating,
            max_reviews: settings.max_reviews,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingSettings.id);
      } else {
        // Insert new record
        result = await supabase
          .from("google_api_settings")
          .insert({
            place_id: settings.place_id,
            min_rating: settings.min_rating,
            max_reviews: settings.max_reviews
          });
      }
        
      if (result.error) throw result.error;
      return { success: true };
    } catch (error: any) {
      console.error("Failed to save Google API settings:", error);
      return { success: false, error: error.message };
    }
  };
  
  return { saveSettings };
}
