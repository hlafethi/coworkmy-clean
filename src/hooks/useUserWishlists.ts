import { useState, useEffect } from "react";
import { isValidUserWishlist } from "@/utils/typeGuards";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { UserWishlist } from "@/types/database";
import { logger } from '@/utils/logger';

type UserWishlistInsert = Omit<UserWishlist, "id" | "created_at" | "updated_at">;
type UserWishlistUpdate = Partial<UserWishlistInsert>;

export function useUserWishlists(userId: string) {
  const [wishlists, setWishlists] = useState<UserWishlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetchWishlists();
  }, [userId]);

  const fetchWishlists = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from("user_wishlists")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const validWishlists = data.filter(isValidUserWishlist);
      setWishlists(validWishlists);
    } catch (err) {
      logger.error("Erreur lors de la récupération des listes de souhaits:", err);
      setError(err instanceof Error ? err : new Error("Erreur inconnue"));
      toast.error("Erreur lors de la récupération des listes de souhaits");
    } finally {
      setLoading(false);
    }
  };

  const createWishlist = async (wishlist: UserWishlistInsert) => {
    try {
      const { data, error } = await supabase
        .from("user_wishlists")
        .insert({ ...wishlist, user_id: userId })
        .select()
        .single();

      if (error) throw error;
      if (!data || !isValidUserWishlist(data)) throw new Error("Données invalides");

      setWishlists(prev => [data, ...prev]);
      toast.success("Liste de souhaits créée avec succès");
      return data;
    } catch (err) {
      logger.error("Erreur lors de la création de la liste de souhaits:", err);
      toast.error("Erreur lors de la création de la liste de souhaits");
      throw err;
    }
  };

  const updateWishlist = async (id: string, wishlist: UserWishlistUpdate) => {
    try {
      const { data, error } = await supabase
        .from("user_wishlists")
        .update(wishlist)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      if (!data || !isValidUserWishlist(data)) throw new Error("Données invalides");

      setWishlists(prev => prev.map(w => w.id === id ? data : w));
      toast.success("Liste de souhaits mise à jour avec succès");
      return data;
    } catch (err) {
      logger.error("Erreur lors de la mise à jour de la liste de souhaits:", err);
      toast.error("Erreur lors de la mise à jour de la liste de souhaits");
      throw err;
    }
  };

  const deleteWishlist = async (id: string) => {
    try {
      const { error } = await supabase
        .from("user_wishlists")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setWishlists(prev => prev.filter(w => w.id !== id));
      toast.success("Liste de souhaits supprimée avec succès");
    } catch (err) {
      logger.error("Erreur lors de la suppression de la liste de souhaits:", err);
      toast.error("Erreur lors de la suppression de la liste de souhaits");
      throw err;
    }
  };

  const archiveWishlist = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from("user_wishlists")
        .update({ is_archived: true })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      if (!data || !isValidUserWishlist(data)) throw new Error("Données invalides");

      setWishlists(prev => prev.map(w => w.id === id ? data : w));
      toast.success("Liste de souhaits archivée avec succès");
      return data;
    } catch (err) {
      logger.error("Erreur lors de l'archivage de la liste de souhaits:", err);
      toast.error("Erreur lors de l'archivage de la liste de souhaits");
      throw err;
    }
  };

  return {
    wishlists,
    loading,
    error,
    fetchWishlists,
    createWishlist,
    updateWishlist,
    deleteWishlist,
    archiveWishlist
  };
} 