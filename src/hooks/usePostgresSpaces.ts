// @ts-nocheck
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { SpaceService } from "@/integrations/postgres/services";
import { Space } from "@/integrations/postgres/types";
import { usePostgresAuth } from "./usePostgresAuth";
import { logger } from '@/utils/logger';

/**
 * Hook pour gérer les espaces de coworking avec PostgreSQL
 */
export function usePostgresSpaces() {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [activeSpaces, setActiveSpaces] = useState<Space[]>([]);
  const [popularSpaces, setPopularSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { isAdmin } = usePostgresAuth();

  /**
   * Récupérer tous les espaces
   */
  const fetchSpaces = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await SpaceService.getAll();
      setSpaces(data);

      // Filtrer les espaces actifs
      const active = data.filter(space => space.is_active);
      setActiveSpaces(active);

      return data;
    } catch (err) {
      logger.error("Erreur lors de la récupération des espaces:", err);
      setError(err as Error);
      toast.error("Impossible de charger les espaces");
      return [];
    } finally {
      setLoading(false);
    }
  };

  /**
   * Récupérer les espaces actifs
   */
  const fetchActiveSpaces = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await SpaceService.getActive();
      setActiveSpaces(data);

      return data;
    } catch (err) {
      logger.error("Erreur lors de la récupération des espaces actifs:", err);
      setError(err as Error);
      toast.error("Impossible de charger les espaces actifs");
      return [];
    } finally {
      setLoading(false);
    }
  };

  /**
   * Récupérer les espaces populaires
   * @param limit Nombre d'espaces à récupérer
   */
  const fetchPopularSpaces = async (limit: number = 5) => {
    try {
      setLoading(true);
      setError(null);

      // Utiliser la fonction RPC get_popular_spaces
      const { query } = await import("@/integrations/postgres/client");
      const result = await query('SELECT * FROM get_popular_spaces($1)', [limit]);
      const data = result.rows;
      
      setPopularSpaces(data);

      return data;
    } catch (err) {
      logger.error("Erreur lors de la récupération des espaces populaires:", err);
      setError(err as Error);
      toast.error("Impossible de charger les espaces populaires");
      return [];
    } finally {
      setLoading(false);
    }
  };

  /**
   * Récupérer un espace par son ID
   * @param id ID de l'espace
   */
  const getSpaceById = async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const data = await SpaceService.getById(id);
      return data;
    } catch (err) {
      logger.error("Erreur lors de la récupération de l'espace:", err);
      setError(err as Error);
      toast.error("Impossible de charger l'espace");
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Créer un nouvel espace
   * @param space Données de l'espace
   */
  const createSpace = async (space: Omit<Space, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setLoading(true);
      setError(null);

      const data = await SpaceService.create(space);
      
      // Mettre à jour la liste des espaces
      await fetchSpaces();
      
      toast.success("Espace créé avec succès");
      return data;
    } catch (err) {
      logger.error("Erreur lors de la création de l'espace:", err);
      setError(err as Error);
      toast.error("Impossible de créer l'espace");
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Mettre à jour un espace
   * @param id ID de l'espace
   * @param space Données de l'espace
   */
  const updateSpace = async (id: string, space: Partial<Omit<Space, 'id' | 'created_at' | 'updated_at'>>) => {
    try {
      setLoading(true);
      setError(null);

      const data = await SpaceService.update(id, space);
      
      // Mettre à jour la liste des espaces
      await fetchSpaces();
      
      toast.success("Espace mis à jour avec succès");
      return data;
    } catch (err) {
      logger.error("Erreur lors de la mise à jour de l'espace:", err);
      setError(err as Error);
      toast.error("Impossible de mettre à jour l'espace");
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Supprimer un espace
   * @param id ID de l'espace
   */
  const deleteSpace = async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const success = await SpaceService.delete(id);
      
      if (success) {
        // Mettre à jour la liste des espaces
        await fetchSpaces();
        
        toast.success("Espace supprimé avec succès");
      } else {
        throw new Error("Impossible de supprimer l'espace");
      }
      
      return success;
    } catch (err) {
      logger.error("Erreur lors de la suppression de l'espace:", err);
      setError(err as Error);
      toast.error("Impossible de supprimer l'espace");
      return false;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Activer ou désactiver un espace
   * @param id ID de l'espace
   * @param isActive État d'activation
   */
  const toggleSpaceActive = async (id: string, isActive: boolean) => {
    try {
      setLoading(true);
      setError(null);

      const data = await SpaceService.update(id, { is_active: isActive });
      
      // Mettre à jour la liste des espaces
      await fetchSpaces();
      
      toast.success(`Espace ${isActive ? 'activé' : 'désactivé'} avec succès`);
      return data;
    } catch (err) {
      logger.error(`Erreur lors de ${isActive ? 'l\'activation' : 'la désactivation'} de l'espace:`, err);
      setError(err as Error);
      toast.error(`Impossible de ${isActive ? 'activer' : 'désactiver'} l'espace`);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Récupérer les espaces au chargement du composant
  useEffect(() => {
    fetchSpaces();
    fetchPopularSpaces();
  }, []);

  return {
    spaces,
    activeSpaces,
    popularSpaces,
    loading,
    error,
    isAdmin,
    fetchSpaces,
    fetchActiveSpaces,
    fetchPopularSpaces,
    getSpaceById,
    createSpace,
    updateSpace,
    deleteSpace,
    toggleSpaceActive
  };
}
