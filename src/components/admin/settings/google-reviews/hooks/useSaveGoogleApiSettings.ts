import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { GoogleReviewsFormValues } from "./useGoogleReviewsForm";
// Logger supprimé - utilisation de console directement
export function useSaveGoogleApiSettings() {
  const [isLoading, setIsLoading] = useState(false);

  const saveSettings = async (values: GoogleReviewsFormValues) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("settings")
        .upsert({
          id: "google_reviews",
          ...values,
        });

      if (error) throw error;

      toast.success("Paramètres sauvegardés avec succès");
    } catch (error) {
      console.error("Erreur lors de la sauvegarde des paramètres:", error);
      toast.error("Erreur lors de la sauvegarde des paramètres");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    saveSettings,
    isLoading,
  };
} 