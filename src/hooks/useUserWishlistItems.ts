import { useState, useEffect } from "react";
import { isValidUserWishlistItem } from "@/utils/typeGuards";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { UserWishlistItem } from "@/types/database";
// Logger supprimé - utilisation de console directement
type UserWishlistItemInsert = Omit<UserWishlistItem, "id" | "created_at" | "updated_at">;
type UserWishlistItemUpdate = Partial<UserWishlistItemInsert>;

export function useUserWishlistItems(wishlistId: string) {
  const [items, setItems] = useState<UserWishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetchItems();
  }, [wishlistId]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("user_wishlist_items")
        .select("*")
        .eq("wishlist_id", wishlistId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const validItems = data.map(item => ({
        ...item,
        status: item.status === 'active' ? 'pending' : item.status
      }));

      setItems(validItems);
    } catch (err) {
      console.error("Erreur lors de la récupération des éléments:", err);
      setError(err instanceof Error ? err : new Error("Erreur inconnue"));
      toast.error("Erreur lors de la récupération des éléments");
    } finally {
      setLoading(false);
    }
  };

  const addItem = async (item: Omit<UserWishlistItem, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from("user_wishlist_items")
        .insert([{ ...item, status: 'pending' }])
        .select()
        .single();

      if (error) throw error;

      setItems(prev => [...prev, data]);
      toast.success("Élément ajouté avec succès");
    } catch (err) {
      console.error("Erreur lors de l'ajout de l'élément:", err);
      toast.error("Erreur lors de l'ajout de l'élément");
      throw err;
    }
  };

  const updateItem = async (id: string, updates: Partial<UserWishlistItem>) => {
    try {
      const { data, error } = await supabase
        .from("user_wishlist_items")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      setItems(prev => prev.map(i => i.id === id ? data : i));
      toast.success("Élément mis à jour avec succès");
    } catch (err) {
      console.error("Erreur lors de la mise à jour de l'élément:", err);
      toast.error("Erreur lors de la mise à jour de l'élément");
      throw err;
    }
  };

  const deleteItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from("user_wishlist_items")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setItems(prev => prev.filter(i => i.id !== id));
      toast.success("Élément supprimé avec succès");
    } catch (err) {
      console.error("Erreur lors de la suppression de l'élément:", err);
      toast.error("Erreur lors de la suppression de l'élément");
      throw err;
    }
  };

  return {
    items,
    loading,
    error,
    fetchItems,
    addItem,
    updateItem,
    deleteItem
  };
} 