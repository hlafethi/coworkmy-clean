import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Space } from "@/components/admin/types";
import { isValidSpace } from "@/utils/typeGuards";
import type { Database } from "@/integrations/supabase/types";
import type { PricingType } from "@/components/admin/spaces/types";

type SpaceRow = Database['public']['Tables']['spaces']['Row'];
type SpaceInsert = Database['public']['Tables']['spaces']['Insert'];
type SpaceUpdate = Database['public']['Tables']['spaces']['Update'];

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

      const { data, error: spaceError } = await supabase
        .from("spaces")
        .select("*")
        .eq("id", spaceId)
        .eq("is_active", true)
        .single();

      if (spaceError) throw spaceError;

      if (!data) {
        throw new Error("Espace non trouvé ou inactif");
      }

      setSpace(data as Space);
    } catch (err) {
      console.error("Erreur lors de la récupération de l'espace:", err);
      setError(err instanceof Error ? err : new Error("Erreur lors du chargement de l'espace"));
      toast.error("Impossible de charger les informations de l'espace");
    } finally {
      setLoading(false);
    }
  }, [spaceId]);

  const fetchSpaces = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from("spaces")
        .select("*")
        .eq("is_active", true);

      if (error) throw error;
      setSpaces(data || []);
    } catch (err) {
      console.error("Error fetching spaces:", err);
      setError(err instanceof Error ? err : new Error("Une erreur est survenue"));
      toast.error("Erreur lors du chargement des espaces");
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    space,
    spaces,
    loading,
    error,
    fetchSpace,
    fetchSpaces
  };
}

export const useSpacesWithoutId = () => {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [selectedSpace, setSelectedSpace] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSpaces = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('spaces')
          .select('*')
          .eq('is_active', true as SpaceRow['is_active']);

        if (error) throw error;

        if (data && data.length > 0) {
          const typedSpaces = data.map(space => ({
            ...space,
            pricing_type: space.pricing_type as PricingType
          }));
          
          setSpaces(typedSpaces);
          // Ne pas sélectionner automatiquement le premier espace
        }
      } catch (error) {
        console.error('Error fetching spaces:', error);
        toast.error("Impossible de récupérer les espaces");
      } finally {
        setLoading(false);
      }
    };

    fetchSpaces();
  }, []);

  const getSpaces = async () => {
    try {
      const { data, error } = await supabase
        .from('spaces')
        .select('*')
        .eq('is_active', true as SpaceRow['is_active']);

      if (error) throw error;

      return data?.filter(isValidSpace) || [];
    } catch (error) {
      console.error('Erreur récupération espaces:', error);
      throw error;
    }
  };

  const createSpace = async (space: SpaceInsert) => {
    try {
      const { data, error } = await supabase
        .from('spaces')
        .insert(space)
        .select()
        .single();

      if (error) throw error;
      if (!data || !isValidSpace(data)) {
        throw new Error("Erreur lors de la création de l'espace");
      }

      return data;
    } catch (error) {
      console.error('Erreur création espace:', error);
      throw error;
    }
  };

  const updateSpace = async (id: string, updates: SpaceUpdate) => {
    try {
      const { data, error } = await supabase
        .from('spaces')
        .update(updates)
        .eq('id', id as SpaceRow['id'])
        .select()
        .single();

      if (error) throw error;
      if (!data || !isValidSpace(data)) {
        throw new Error("Erreur lors de la mise à jour de l'espace");
      }

      return data;
    } catch (error) {
      console.error('Erreur mise à jour espace:', error);
      throw error;
    }
  };

  const deleteSpace = async (id: string) => {
    try {
      // D'abord, nettoyer les enregistrements dans stripe_sync_queue
      const { error: cleanupError } = await supabase
        .from('stripe_sync_queue')
        .delete()
        .eq('space_id', id);

      if (cleanupError) {
        console.warn('Erreur lors du nettoyage de la queue Stripe:', cleanupError);
      }

      // Ensuite, supprimer l'espace
      const { error } = await supabase
        .from('spaces')
        .delete()
        .eq('id', id as SpaceRow['id']);

      if (error) throw error;
    } catch (error) {
      console.error('Erreur suppression espace:', error);
      throw error;
    }
  };

  return {
    spaces,
    selectedSpace,
    setSelectedSpace,
    loading,
    getSpaces,
    createSpace,
    updateSpace,
    deleteSpace
  };
};
