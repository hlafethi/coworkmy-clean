import { useState, useEffect } from "react";
import { isValidUserWallet } from "@/utils/typeGuards";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { UserWallet } from "@/components/admin/types";

type UserWalletInsert = Omit<UserWallet, "id" | "created_at" | "updated_at">;
type UserWalletUpdate = Partial<UserWalletInsert>;

export function useUserWallets(userId: string) {
  const [wallets, setWallets] = useState<UserWallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchUserWallets = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("user_wallets")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const validWallets = data.filter(isValidUserWallet);
      setWallets(validWallets);
    } catch (err) {
      console.error("Erreur lors de la récupération des portefeuilles:", err);
      setError(err instanceof Error ? err : new Error("Erreur inconnue"));
      toast.error("Erreur lors de la récupération des portefeuilles");
    } finally {
      setLoading(false);
    }
  };

  const createWallet = async (wallet: UserWalletInsert) => {
    try {
      const { data, error } = await supabase
        .from("user_wallets")
        .insert({ ...wallet, user_id: userId })
        .select()
        .single();

      if (error) throw error;
      if (!data || !isValidUserWallet(data)) throw new Error("Données invalides");

      setWallets(prev => [data, ...prev]);
      toast.success("Portefeuille créé avec succès");
      return data;
    } catch (err) {
      console.error("Erreur lors de la création du portefeuille:", err);
      toast.error("Erreur lors de la création du portefeuille");
      throw err;
    }
  };

  const updateWallet = async (id: string, wallet: UserWalletUpdate) => {
    try {
      const { data, error } = await supabase
        .from("user_wallets")
        .update(wallet)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      if (!data || !isValidUserWallet(data)) throw new Error("Données invalides");

      setWallets(prev => prev.map(w => w.id === id ? data : w));
      toast.success("Portefeuille mis à jour avec succès");
      return data;
    } catch (err) {
      console.error("Erreur lors de la mise à jour du portefeuille:", err);
      toast.error("Erreur lors de la mise à jour du portefeuille");
      throw err;
    }
  };

  const closeWallet = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from("user_wallets")
        .update({ status: "closed" })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      if (!data || !isValidUserWallet(data)) throw new Error("Données invalides");

      setWallets(prev => prev.map(w => w.id === id ? data : w));
      toast.success("Portefeuille fermé avec succès");
      return data;
    } catch (err) {
      console.error("Erreur lors de la fermeture du portefeuille:", err);
      toast.error("Erreur lors de la fermeture du portefeuille");
      throw err;
    }
  };

  useEffect(() => {
    if (userId) {
      fetchUserWallets();
    }
  }, [userId]);

  return {
    wallets,
    loading,
    error,
    fetchUserWallets,
    createWallet,
    updateWallet,
    closeWallet
  };
} 