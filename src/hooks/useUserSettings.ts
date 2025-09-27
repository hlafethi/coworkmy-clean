import { useState, useEffect } from "react";
import { isValidUserSetting } from "@/utils/typeGuards";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { UserSetting } from "@/components/admin/types";

type UserSettingInsert = Omit<UserSetting, "id" | "created_at" | "updated_at">;
type UserSettingUpdate = Partial<UserSettingInsert>;

export function useUserSettings(userId: string) {
  const [settings, setSettings] = useState<UserSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchUserSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", userId)
        .order("key");

      if (error) throw error;

      const validSettings = data.filter(isValidUserSetting);
      setSettings(validSettings);
    } catch (err) {
      console.error("Erreur lors de la récupération des paramètres utilisateur:", err);
      setError(err instanceof Error ? err : new Error("Erreur inconnue"));
      toast.error("Erreur lors de la récupération des paramètres utilisateur");
    } finally {
      setLoading(false);
    }
  };

  const createUserSetting = async (setting: UserSettingInsert) => {
    try {
      const { data, error } = await supabase
        .from("user_settings")
        .insert({ ...setting, user_id: userId })
        .select()
        .single();

      if (error) throw error;
      if (!data || !isValidUserSetting(data)) throw new Error("Données invalides");

      setSettings(prev => [...prev, data]);
      toast.success("Paramètre utilisateur créé avec succès");
      return data;
    } catch (err) {
      console.error("Erreur lors de la création du paramètre utilisateur:", err);
      toast.error("Erreur lors de la création du paramètre utilisateur");
      throw err;
    }
  };

  const updateUserSetting = async (id: string, setting: UserSettingUpdate) => {
    try {
      const { data, error } = await supabase
        .from("user_settings")
        .update(setting)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      if (!data || !isValidUserSetting(data)) throw new Error("Données invalides");

      setSettings(prev => prev.map(s => s.id === id ? data : s));
      toast.success("Paramètre utilisateur mis à jour avec succès");
      return data;
    } catch (err) {
      console.error("Erreur lors de la mise à jour du paramètre utilisateur:", err);
      toast.error("Erreur lors de la mise à jour du paramètre utilisateur");
      throw err;
    }
  };

  const deleteUserSetting = async (id: string) => {
    try {
      const { error } = await supabase
        .from("user_settings")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setSettings(prev => prev.filter(s => s.id !== id));
      toast.success("Paramètre utilisateur supprimé avec succès");
    } catch (err) {
      console.error("Erreur lors de la suppression du paramètre utilisateur:", err);
      toast.error("Erreur lors de la suppression du paramètre utilisateur");
      throw err;
    }
  };

  useEffect(() => {
    if (userId) {
      fetchUserSettings();
    }
  }, [userId]);

  return {
    settings,
    loading,
    error,
    fetchUserSettings,
    createUserSetting,
    updateUserSetting,
    deleteUserSetting
  };
} 