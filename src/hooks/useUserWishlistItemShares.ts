import { useState, useEffect } from "react";
import { isValidUserWishlistItemShare } from "@/utils/typeGuards";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { UserWishlistItemShare } from "@/types/database";

type UserWishlistItemShareInsert = Omit<UserWishlistItemShare, "id" | "created_at" | "updated_at">;
type UserWishlistItemShareUpdate = Partial<UserWishlistItemShareInsert>;

export function useUserWishlistItemShares(itemId: string) {
  const [shares, setShares] = useState<UserWishlistItemShare[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetchShares();
  }, [itemId]);

  const fetchShares = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("user_wishlist_item_shares")
        .select("*")
        .eq("item_id", itemId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const validShares = data.map(share => ({
        ...share,
        item_id: share.item_id,
        shared_with_id: share.shared_with_id,
        permission: share.permission === 'read' ? 'view' : share.permission
      }));

      setShares(validShares);
    } catch (err) {
      console.error("Erreur lors de la récupération des partages:", err);
      setError(err instanceof Error ? err : new Error("Erreur inconnue"));
      toast.error("Erreur lors de la récupération des partages");
    } finally {
      setLoading(false);
    }
  };

  const addShare = async (share: Omit<UserWishlistItemShare, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from("user_wishlist_item_shares")
        .insert([share])
        .select()
        .single();

      if (error) throw error;

      setShares(prev => [data, ...prev]);
      toast.success("Partage ajouté avec succès");
    } catch (err) {
      console.error("Erreur lors de l'ajout du partage:", err);
      toast.error("Erreur lors de l'ajout du partage");
      throw err;
    }
  };

  const updateShare = async (id: string, updates: Partial<UserWishlistItemShare>) => {
    try {
      const { data, error } = await supabase
        .from("user_wishlist_item_shares")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      setShares(prev => prev.map(s => s.id === id ? data : s));
      toast.success("Partage mis à jour avec succès");
    } catch (err) {
      console.error("Erreur lors de la mise à jour du partage:", err);
      toast.error("Erreur lors de la mise à jour du partage");
      throw err;
    }
  };

  const deleteShare = async (id: string) => {
    try {
      const { error } = await supabase
        .from("user_wishlist_item_shares")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setShares(prev => prev.filter(s => s.id !== id));
      toast.success("Partage supprimé avec succès");
    } catch (err) {
      console.error("Erreur lors de la suppression du partage:", err);
      toast.error("Erreur lors de la suppression du partage");
      throw err;
    }
  };

  return {
    shares,
    loading,
    error,
    fetchShares,
    addShare,
    updateShare,
    deleteShare
  };
} 