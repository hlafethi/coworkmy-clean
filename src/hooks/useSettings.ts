import { useState, useEffect } from "react";
import { isValidSetting } from "@/utils/typeGuards";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Setting } from "@/components/admin/types";

type SettingInsert = Omit<Setting, "id" | "created_at" | "updated_at">;
type SettingUpdate = Partial<SettingInsert>;

export function useSettings() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("settings")
        .select("*")
        .order("key");

      if (error) throw error;

      const validSettings = data.filter(isValidSetting);
      setSettings(validSettings);
    } catch (err) {
      console.error("Erreur lors de la récupération des paramètres:", err);
      setError(err instanceof Error ? err : new Error("Erreur inconnue"));
      toast.error("Erreur lors de la récupération des paramètres");
    } finally {
      setLoading(false);
    }
  };

  const createSetting = async (setting: SettingInsert) => {
    try {
      const { data, error } = await supabase
        .from("settings")
        .insert(setting)
        .select()
        .single();

      if (error) throw error;
      if (!data || !isValidSetting(data)) throw new Error("Données invalides");

      setSettings(prev => [...prev, data]);
      toast.success("Paramètre créé avec succès");
      return data;
    } catch (err) {
      console.error("Erreur lors de la création du paramètre:", err);
      toast.error("Erreur lors de la création du paramètre");
      throw err;
    }
  };

  const updateSetting = async (id: string, setting: SettingUpdate) => {
    try {
      const { data, error } = await supabase
        .from("settings")
        .update(setting)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      if (!data || !isValidSetting(data)) throw new Error("Données invalides");

      setSettings(prev => prev.map(s => s.id === id ? data : s));
      toast.success("Paramètre mis à jour avec succès");
      return data;
    } catch (err) {
      console.error("Erreur lors de la mise à jour du paramètre:", err);
      toast.error("Erreur lors de la mise à jour du paramètre");
      throw err;
    }
  };

  const deleteSetting = async (id: string) => {
    try {
      const { error } = await supabase
        .from("settings")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setSettings(prev => prev.filter(s => s.id !== id));
      toast.success("Paramètre supprimé avec succès");
    } catch (err) {
      console.error("Erreur lors de la suppression du paramètre:", err);
      toast.error("Erreur lors de la suppression du paramètre");
      throw err;
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return {
    settings,
    loading,
    error,
    fetchSettings,
    createSetting,
    updateSetting,
    deleteSetting
  };
} 