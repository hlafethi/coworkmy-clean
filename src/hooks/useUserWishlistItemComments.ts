import { useState, useEffect } from "react";
import { isValidUserWishlistItemComment } from "@/utils/typeGuards";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { UserWishlistItemComment } from "@/components/admin/types";
// Logger supprimé - utilisation de console directement
type UserWishlistItemCommentInsert = Omit<UserWishlistItemComment, "id" | "created_at" | "updated_at">;
type UserWishlistItemCommentUpdate = Partial<UserWishlistItemCommentInsert>;

export function useUserWishlistItemComments(userId: string, wishlistItemId: string) {
  const [comments, setComments] = useState<UserWishlistItemComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchComments = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("user_wishlist_item_comments")
        .select("*")
        .eq("wishlist_item_id", wishlistItemId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const validComments = data.filter(isValidUserWishlistItemComment);
      setComments(validComments);
    } catch (err) {
      console.error("Erreur lors de la récupération des commentaires:", err);
      setError(err instanceof Error ? err : new Error("Erreur inconnue"));
      toast.error("Erreur lors de la récupération des commentaires");
    } finally {
      setLoading(false);
    }
  };

  const addComment = async (comment: UserWishlistItemCommentInsert) => {
    try {
      const { data, error } = await supabase
        .from("user_wishlist_item_comments")
        .insert({ ...comment, user_id: userId, wishlist_item_id: wishlistItemId })
        .select()
        .single();

      if (error) throw error;
      if (!data || !isValidUserWishlistItemComment(data)) throw new Error("Données invalides");

      setComments(prev => [data, ...prev]);
      toast.success("Commentaire ajouté avec succès");
      return data;
    } catch (err) {
      console.error("Erreur lors de l'ajout du commentaire:", err);
      toast.error("Erreur lors de l'ajout du commentaire");
      throw err;
    }
  };

  const updateComment = async (id: string, comment: UserWishlistItemCommentUpdate) => {
    try {
      const { data, error } = await supabase
        .from("user_wishlist_item_comments")
        .update(comment)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      if (!data || !isValidUserWishlistItemComment(data)) throw new Error("Données invalides");

      setComments(prev => prev.map(c => c.id === id ? data : c));
      toast.success("Commentaire mis à jour avec succès");
      return data;
    } catch (err) {
      console.error("Erreur lors de la mise à jour du commentaire:", err);
      toast.error("Erreur lors de la mise à jour du commentaire");
      throw err;
    }
  };

  const deleteComment = async (id: string) => {
    try {
      const { error } = await supabase
        .from("user_wishlist_item_comments")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setComments(prev => prev.filter(c => c.id !== id));
      toast.success("Commentaire supprimé avec succès");
    } catch (err) {
      console.error("Erreur lors de la suppression du commentaire:", err);
      toast.error("Erreur lors de la suppression du commentaire");
      throw err;
    }
  };

  useEffect(() => {
    if (userId && wishlistItemId) {
      fetchComments();
    }
  }, [userId, wishlistItemId]);

  return {
    comments,
    loading,
    error,
    fetchComments,
    addComment,
    updateComment,
    deleteComment
  };
} 