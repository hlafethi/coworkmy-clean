import { useState, useEffect } from "react";
import { isValidUserToken } from "@/utils/typeGuards";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { UserToken } from "@/components/admin/types";
import { logger } from '@/utils/logger';

type UserTokenInsert = Omit<UserToken, "id" | "created_at" | "updated_at">;

export function useUserTokens(userId: string) {
  const [tokens, setTokens] = useState<UserToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchUserTokens = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("user_tokens")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const validTokens = data.filter(isValidUserToken);
      setTokens(validTokens);
    } catch (err) {
      logger.error("Erreur lors de la récupération des tokens:", err);
      setError(err instanceof Error ? err : new Error("Erreur inconnue"));
      toast.error("Erreur lors de la récupération des tokens");
    } finally {
      setLoading(false);
    }
  };

  const createToken = async (token: UserTokenInsert) => {
    try {
      const { data, error } = await supabase
        .from("user_tokens")
        .insert({ ...token, user_id: userId })
        .select()
        .single();

      if (error) throw error;
      if (!data || !isValidUserToken(data)) throw new Error("Données invalides");

      setTokens(prev => [data, ...prev]);
      toast.success("Token créé avec succès");
      return data;
    } catch (err) {
      logger.error("Erreur lors de la création du token:", err);
      toast.error("Erreur lors de la création du token");
      throw err;
    }
  };

  const revokeToken = async (id: string) => {
    try {
      const { error } = await supabase
        .from("user_tokens")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setTokens(prev => prev.filter(t => t.id !== id));
      toast.success("Token révoqué avec succès");
    } catch (err) {
      logger.error("Erreur lors de la révocation du token:", err);
      toast.error("Erreur lors de la révocation du token");
      throw err;
    }
  };

  const revokeAllTokens = async () => {
    try {
      const { error } = await supabase
        .from("user_tokens")
        .delete()
        .eq("user_id", userId);

      if (error) throw error;

      setTokens([]);
      toast.success("Tous les tokens ont été révoqués");
    } catch (err) {
      logger.error("Erreur lors de la révocation des tokens:", err);
      toast.error("Erreur lors de la révocation des tokens");
      throw err;
    }
  };

  useEffect(() => {
    if (userId) {
      fetchUserTokens();
    }
  }, [userId]);

  return {
    tokens,
    loading,
    error,
    fetchUserTokens,
    createToken,
    revokeToken,
    revokeAllTokens
  };
} 