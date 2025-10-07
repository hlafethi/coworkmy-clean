import { useState, useEffect } from "react";
import { isValidUserSubscription } from "@/utils/typeGuards";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { UserSubscription } from "@/components/admin/types";
// Logger supprimé - utilisation de console directement
type UserSubscriptionInsert = Omit<UserSubscription, "id" | "created_at" | "updated_at">;
type UserSubscriptionUpdate = Partial<UserSubscriptionInsert>;

export function useUserSubscriptions(userId: string) {
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchUserSubscriptions = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("user_subscriptions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const validSubscriptions = data.filter(isValidUserSubscription);
      setSubscriptions(validSubscriptions);
    } catch (err) {
      console.error("Erreur lors de la récupération des abonnements:", err);
      setError(err instanceof Error ? err : new Error("Erreur inconnue"));
      toast.error("Erreur lors de la récupération des abonnements");
    } finally {
      setLoading(false);
    }
  };

  const createSubscription = async (subscription: UserSubscriptionInsert) => {
    try {
      const { data, error } = await supabase
        .from("user_subscriptions")
        .insert({ ...subscription, user_id: userId })
        .select()
        .single();

      if (error) throw error;
      if (!data || !isValidUserSubscription(data)) throw new Error("Données invalides");

      setSubscriptions(prev => [data, ...prev]);
      toast.success("Abonnement créé avec succès");
      return data;
    } catch (err) {
      console.error("Erreur lors de la création de l'abonnement:", err);
      toast.error("Erreur lors de la création de l'abonnement");
      throw err;
    }
  };

  const updateSubscription = async (id: string, subscription: UserSubscriptionUpdate) => {
    try {
      const { data, error } = await supabase
        .from("user_subscriptions")
        .update(subscription)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      if (!data || !isValidUserSubscription(data)) throw new Error("Données invalides");

      setSubscriptions(prev => prev.map(s => s.id === id ? data : s));
      toast.success("Abonnement mis à jour avec succès");
      return data;
    } catch (err) {
      console.error("Erreur lors de la mise à jour de l'abonnement:", err);
      toast.error("Erreur lors de la mise à jour de l'abonnement");
      throw err;
    }
  };

  const cancelSubscription = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from("user_subscriptions")
        .update({ status: "cancelled" })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      if (!data || !isValidUserSubscription(data)) throw new Error("Données invalides");

      setSubscriptions(prev => prev.map(s => s.id === id ? data : s));
      toast.success("Abonnement annulé avec succès");
      return data;
    } catch (err) {
      console.error("Erreur lors de l'annulation de l'abonnement:", err);
      toast.error("Erreur lors de l'annulation de l'abonnement");
      throw err;
    }
  };

  useEffect(() => {
    if (userId) {
      fetchUserSubscriptions();
    }
  }, [userId]);

  return {
    subscriptions,
    loading,
    error,
    fetchUserSubscriptions,
    createSubscription,
    updateSubscription,
    cancelSubscription
  };
} 