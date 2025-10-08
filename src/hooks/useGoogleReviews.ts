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
  // Supabase désactivé - retourner des données vides
  console.log('Google Reviews désactivé - utilisation de PostgreSQL uniquement');
  return [];
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
      // Supabase désactivé - retourner null
      console.log("Google API Settings désactivé - utilisation de PostgreSQL uniquement");
      return null;
    }
  });
}

export function useSaveGoogleApiSettings() {
  const saveSettings = async (settings: GoogleApiSettings) => {
    // Supabase désactivé - ne rien faire
    console.log("Save Google API Settings désactivé - utilisation de PostgreSQL uniquement");
    return { success: true };
  };
  
  return { saveSettings };
}
