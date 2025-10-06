import { useState, useEffect } from "react";
import { isValidUserWishlistItemLike } from "@/utils/typeGuards";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { UserWishlistItemLike } from "@/components/admin/types";
import { logger } from '@/utils/logger';

export function useUserWishlistItemLikes(userId: string, wishlistItemId: string) {
  const [likes, setLikes] = useState<UserWishlistItemLike[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchLikes = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("user_wishlist_item_likes")
        .select("*")
        .eq("wishlist_item_id", wishlistItemId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const validLikes = data.filter(isValidUserWishlistItemLike);
      setLikes(validLikes);
    } catch (err) {
      logger.error("Erreur lors de la récupération des likes:", err);
      setError(err instanceof Error ? err : new Error("Erreur inconnue"));
      toast.error("Erreur lors de la récupération des likes");
    } finally {
      setLoading(false);
    }
  };

  const addLike = async () => {
    try {
      const { data, error } = await supabase
        .from("user_wishlist_item_likes")
        .insert({ user_id: userId, wishlist_item_id: wishlistItemId })
        .select()
        .single();

      if (error) throw error;
      if (!data || !isValidUserWishlistItemLike(data)) throw new Error("Données invalides");

      setLikes(prev => [data, ...prev]);
      toast.success("Like ajouté avec succès");
      return data;
    } catch (err) {
      logger.error("Erreur lors de l'ajout du like:", err);
      toast.error("Erreur lors de l'ajout du like");
      throw err;
    }
  };

  const removeLike = async (id: string) => {
    try {
      const { error } = await supabase
        .from("user_wishlist_item_likes")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setLikes(prev => prev.filter(l => l.id !== id));
      toast.success("Like supprimé avec succès");
    } catch (err) {
      logger.error("Erreur lors de la suppression du like:", err);
      toast.error("Erreur lors de la suppression du like");
      throw err;
    }
  };

  const toggleLike = async () => {
    const existingLike = likes.find(like => like.user_id === userId);
    if (existingLike) {
      await removeLike(existingLike.id);
    } else {
      await addLike();
    }
  };

  useEffect(() => {
    if (userId && wishlistItemId) {
      fetchLikes();
    }
  }, [userId, wishlistItemId]);

  return {
    likes,
    loading,
    error,
    fetchLikes,
    addLike,
    removeLike,
    toggleLike
  };
} 