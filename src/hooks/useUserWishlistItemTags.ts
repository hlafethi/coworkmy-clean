import { useState, useEffect } from "react";
import { isValidUserWishlistItemTag } from "@/utils/typeGuards";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { UserWishlistItemTag } from "@/components/admin/types";
import { logger } from '@/utils/logger';

type UserWishlistItemTagInsert = Omit<UserWishlistItemTag, "id" | "created_at" | "updated_at">;
type UserWishlistItemTagUpdate = Partial<UserWishlistItemTagInsert>;

export function useUserWishlistItemTags(userId: string, wishlistItemId: string) {
  const [tags, setTags] = useState<UserWishlistItemTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchTags = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("user_wishlist_item_tags")
        .select("*")
        .eq("wishlist_item_id", wishlistItemId)
        .order("name", { ascending: true });

      if (error) throw error;

      const validTags = data.filter(isValidUserWishlistItemTag);
      setTags(validTags);
    } catch (err) {
      logger.error("Erreur lors de la récupération des tags:", err);
      setError(err instanceof Error ? err : new Error("Erreur inconnue"));
      toast.error("Erreur lors de la récupération des tags");
    } finally {
      setLoading(false);
    }
  };

  const addTag = async (tag: UserWishlistItemTagInsert) => {
    try {
      const { data, error } = await supabase
        .from("user_wishlist_item_tags")
        .insert({ ...tag, user_id: userId, wishlist_item_id: wishlistItemId })
        .select()
        .single();

      if (error) throw error;
      if (!data || !isValidUserWishlistItemTag(data)) throw new Error("Données invalides");

      setTags(prev => [...prev, data]);
      toast.success("Tag ajouté avec succès");
      return data;
    } catch (err) {
      logger.error("Erreur lors de l'ajout du tag:", err);
      toast.error("Erreur lors de l'ajout du tag");
      throw err;
    }
  };

  const updateTag = async (id: string, tag: UserWishlistItemTagUpdate) => {
    try {
      const { data, error } = await supabase
        .from("user_wishlist_item_tags")
        .update(tag)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      if (!data || !isValidUserWishlistItemTag(data)) throw new Error("Données invalides");

      setTags(prev => prev.map(t => t.id === id ? data : t));
      toast.success("Tag mis à jour avec succès");
      return data;
    } catch (err) {
      logger.error("Erreur lors de la mise à jour du tag:", err);
      toast.error("Erreur lors de la mise à jour du tag");
      throw err;
    }
  };

  const deleteTag = async (id: string) => {
    try {
      const { error } = await supabase
        .from("user_wishlist_item_tags")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setTags(prev => prev.filter(t => t.id !== id));
      toast.success("Tag supprimé avec succès");
    } catch (err) {
      logger.error("Erreur lors de la suppression du tag:", err);
      toast.error("Erreur lors de la suppression du tag");
      throw err;
    }
  };

  useEffect(() => {
    if (userId && wishlistItemId) {
      fetchTags();
    }
  }, [userId, wishlistItemId]);

  return {
    tags,
    loading,
    error,
    fetchTags,
    addTag,
    updateTag,
    deleteTag
  };
} 