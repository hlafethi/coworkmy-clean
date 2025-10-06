import { useState } from "react";
import { toast } from "sonner";
import { logger } from '@/utils/logger';

interface PlaceDetails {
  name: string;
  rating: number;
  user_ratings_total: number;
}

export function useGooglePlaceDetails() {
  const [isLoading, setIsLoading] = useState(false);
  const [placeDetails, setPlaceDetails] = useState<PlaceDetails | null>(null);

  const fetchPlaceDetails = async (apiKey: string, placeId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,rating,user_ratings_total&key=${apiKey}`
      );

      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des détails du lieu");
      }

      const data = await response.json();

      if (data.status !== "OK") {
        throw new Error(data.error_message || "Erreur lors de la récupération des détails du lieu");
      }

      setPlaceDetails(data.result);
      toast.success("Connexion établie avec succès");
    } catch (error) {
      logger.error("Erreur lors de la récupération des détails du lieu:", error);
      toast.error(error instanceof Error ? error.message : "Erreur inconnue");
      setPlaceDetails(null);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    fetchPlaceDetails,
    isLoading,
    placeDetails,
  };
} 