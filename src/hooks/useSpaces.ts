import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import type { Space } from "@/components/admin/types";
import { isValidSpace } from "@/utils/typeGuards";
import type { PricingType } from "@/components/admin/spaces/types";
// Logger supprimé - utilisation de console directement
// Types simplifiés pour PostgreSQL
interface SpaceRow {
  id: string;
  name: string;
  description?: string;
  hourly_price?: number;
  daily_price?: number;
  half_day_price?: number;
  monthly_price?: number;
  quarter_price?: number;
  yearly_price?: number;
  custom_price?: number;
  custom_label?: string;
  pricing_type?: string;
  capacity?: number;
  amenities?: string[];
  image_url?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

interface SpaceInsert {
  name: string;
  description?: string;
  hourly_price?: number;
  daily_price?: number;
  half_day_price?: number;
  monthly_price?: number;
  quarter_price?: number;
  yearly_price?: number;
  custom_price?: number;
  custom_label?: string;
  pricing_type?: string;
  capacity?: number;
  amenities?: string[];
  image_url?: string;
  is_active?: boolean;
}

interface SpaceUpdate {
  name?: string;
  description?: string;
  hourly_price?: number;
  daily_price?: number;
  half_day_price?: number;
  monthly_price?: number;
  quarter_price?: number;
  yearly_price?: number;
  custom_price?: number;
  custom_label?: string;
  pricing_type?: string;
  capacity?: number;
  amenities?: string[];
  image_url?: string;
  is_active?: boolean;
}

export function useSpaces(spaceId?: string) {
  const [space, setSpace] = useState<Space | null>(null);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchSpace = useCallback(async () => {
    if (!spaceId) {
      setError(new Error("ID de l'espace manquant"));
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('Fetching space...');
      const response = await apiClient.get(`/spaces/${spaceId}`);
      
      if (response.success && response.data) {
        const spaceData = response.data;
        if (isValidSpace(spaceData)) {
          setSpace(spaceData);
        } else {
          throw new Error("Données d'espace invalides");
        }
      } else {
        throw new Error(response.error || "Erreur lors de la récupération de l'espace");
      }
    } catch (err) {
      console.error('Error fetching space:', err);
      setError(err instanceof Error ? err : new Error("Erreur inconnue"));
    } finally {
      setLoading(false);
    }
  }, [spaceId]);

  const fetchSpaces = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Fetching spaces...');
      const response = await apiClient.get('/spaces/active');
      
      if (response.success && response.data) {
        const spacesData = Array.isArray(response.data) ? response.data : [];
        const validSpaces = spacesData.filter(isValidSpace);
        setSpaces(validSpaces);
      } else {
        throw new Error(response.error || "Erreur lors de la récupération des espaces");
      }
    } catch (err) {
      console.error('Error fetching spaces:', err);
      setError(err instanceof Error ? err : new Error("Erreur inconnue"));
    } finally {
      setLoading(false);
    }
  }, []);

  const createSpace = useCallback(async (spaceData: SpaceInsert): Promise<Space | null> => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.post('/spaces', spaceData);
      
      if (response.success && response.data) {
        const newSpace = response.data;
        if (isValidSpace(newSpace)) {
          setSpaces(prev => [...prev, newSpace]);
          toast.success("Espace créé avec succès");
          return newSpace;
        } else {
          throw new Error("Données d'espace invalides");
        }
      } else {
        throw new Error(response.error || "Erreur lors de la création de l'espace");
      }
    } catch (err) {
      console.error('Error creating space:', err);
      setError(err instanceof Error ? err : new Error("Erreur inconnue"));
      toast.error("Erreur lors de la création de l'espace");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSpace = useCallback(async (id: string, updates: SpaceUpdate): Promise<Space | null> => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.put(`/spaces/${id}`, updates);
      
      if (response.success && response.data) {
        const updatedSpace = response.data;
        if (isValidSpace(updatedSpace)) {
          setSpaces(prev => prev.map(space => space.id === id ? updatedSpace : space));
          if (spaceId === id) {
            setSpace(updatedSpace);
          }
          toast.success("Espace mis à jour avec succès");
          return updatedSpace;
        } else {
          throw new Error("Données d'espace invalides");
        }
      } else {
        throw new Error(response.error || "Erreur lors de la mise à jour de l'espace");
      }
    } catch (err) {
      console.error('Error updating space:', err);
      setError(err instanceof Error ? err : new Error("Erreur inconnue"));
      toast.error("Erreur lors de la mise à jour de l'espace");
      return null;
    } finally {
      setLoading(false);
    }
  }, [spaceId]);

  const deleteSpace = useCallback(async (id: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.delete(`/spaces/${id}`);
      
      if (response.success) {
        setSpaces(prev => prev.filter(space => space.id !== id));
        if (spaceId === id) {
          setSpace(null);
        }
        toast.success("Espace supprimé avec succès");
        return true;
      } else {
        throw new Error(response.error || "Erreur lors de la suppression de l'espace");
      }
    } catch (err) {
      console.error('Error deleting space:', err);
      setError(err instanceof Error ? err : new Error("Erreur inconnue"));
      toast.error("Erreur lors de la suppression de l'espace");
      return false;
    } finally {
      setLoading(false);
    }
  }, [spaceId]);

  useEffect(() => {
    if (spaceId) {
      fetchSpace();
    } else {
      fetchSpaces();
    }
  }, [spaceId, fetchSpace, fetchSpaces]);

  return {
    space,
    spaces,
    loading,
    error,
    createSpace,
    updateSpace,
    deleteSpace,
    refetch: spaceId ? fetchSpace : fetchSpaces
  };
}