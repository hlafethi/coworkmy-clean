import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { GoogleReviewsFormValues } from "./useGoogleReviewsForm";

export function useGoogleApiSettings() {
  const [settings, setSettings] = useState<GoogleReviewsFormValues | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const { data, error } = await supabase
          .from("settings")
          .select("*")
          .eq("id", "google_reviews")
          .single();

        if (error) throw error;

        setSettings(data as GoogleReviewsFormValues);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Erreur inconnue"));
      } finally {
        setIsLoading(false);
      }
    }

    fetchSettings();
  }, []);

  return {
    settings,
    isLoading,
    error,
  };
} 