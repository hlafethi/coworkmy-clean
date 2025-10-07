import { useState, useEffect } from "react";
import { isValidUserRole } from "@/utils/typeGuards";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { UserRole } from "@/components/admin/types";
// Logger supprimé - utilisation de console directement
export function useUserRoles(userId: string) {
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchUserRoles = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("user_roles")
        .select("*")
        .eq("user_id", userId)
        .order("created_at");

      if (error) throw error;

      const validRoles = data.filter(isValidUserRole);
      setRoles(validRoles);
    } catch (err) {
      console.error("Erreur lors de la récupération des rôles utilisateur:", err);
      setError(err instanceof Error ? err : new Error("Erreur inconnue"));
      toast.error("Erreur lors de la récupération des rôles utilisateur");
    } finally {
      setLoading(false);
    }
  };

  const assignRole = async (roleId: string) => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role_id: roleId })
        .select()
        .single();

      if (error) throw error;
      if (!data || !isValidUserRole(data)) throw new Error("Données invalides");

      setRoles(prev => [...prev, data]);
      toast.success("Rôle assigné avec succès");
      return data;
    } catch (err) {
      console.error("Erreur lors de l'assignation du rôle:", err);
      toast.error("Erreur lors de l'assignation du rôle");
      throw err;
    }
  };

  const removeRole = async (id: string) => {
    try {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setRoles(prev => prev.filter(r => r.id !== id));
      toast.success("Rôle retiré avec succès");
    } catch (err) {
      console.error("Erreur lors du retrait du rôle:", err);
      toast.error("Erreur lors du retrait du rôle");
      throw err;
    }
  };

  useEffect(() => {
    if (userId) {
      fetchUserRoles();
    }
  }, [userId]);

  return {
    roles,
    loading,
    error,
    fetchUserRoles,
    assignRole,
    removeRole
  };
} 