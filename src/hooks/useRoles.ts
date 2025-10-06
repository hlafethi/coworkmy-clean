import { useState, useEffect } from "react";
import { isValidRole } from "@/utils/typeGuards";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Role } from "@/types/database";
import { logger } from '@/utils/logger';

export interface RolePermissions {
  can_manage_users: boolean;
  can_manage_roles: boolean;
  can_manage_spaces: boolean;
  can_manage_bookings: boolean;
  can_manage_payments: boolean;
  can_manage_settings: boolean;
}

export interface RoleWithPermissions extends Role {
  permissions: RolePermissions;
}

export function useRoles() {
  const [roles, setRoles] = useState<RoleWithPermissions[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const validRoles = data.map(role => ({
        ...role,
        permissions: role.permissions as RolePermissions
      }));

      setRoles(validRoles);
    } catch (error) {
      logger.error('Erreur lors de la récupération des rôles:', error);
      setError(error instanceof Error ? error.message : 'Une erreur est survenue');
      toast.error("Erreur lors de la récupération des rôles");
    } finally {
      setLoading(false);
    }
  };

  const createRole = async (role: RoleWithPermissions) => {
    try {
      const { data, error } = await supabase
        .from('roles')
        .insert(role)
        .select()
        .single();

      if (error) throw error;
      if (!data || !isValidRole(data)) {
        throw new Error("Erreur lors de la création du rôle");
      }

      setRoles(prev => [data as RoleWithPermissions, ...prev]);
      toast.success("Rôle créé avec succès");
      return data;
    } catch (error) {
      logger.error('Erreur création rôle:', error);
      toast.error("Erreur lors de la création du rôle");
      throw error;
    }
  };

  const updateRole = async (id: string, updates: Partial<RoleWithPermissions>) => {
    try {
      const { data, error } = await supabase
        .from('roles')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      if (!data || !isValidRole(data)) {
        throw new Error("Erreur lors de la mise à jour du rôle");
      }

      setRoles(prev => 
        prev.map(role => 
          role.id === id ? (data as RoleWithPermissions) : role
        )
      );
      toast.success("Rôle mis à jour avec succès");
      return data;
    } catch (error) {
      logger.error('Erreur mise à jour rôle:', error);
      toast.error("Erreur lors de la mise à jour du rôle");
      throw error;
    }
  };

  const deleteRole = async (id: string) => {
    try {
      const { error } = await supabase
        .from('roles')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setRoles(prev => 
        prev.filter(role => role.id !== id)
      );
      toast.success("Rôle supprimé avec succès");
    } catch (error) {
      logger.error('Erreur suppression rôle:', error);
      toast.error("Erreur lors de la suppression du rôle");
      throw error;
    }
  };

  return {
    roles,
    loading,
    error,
    createRole,
    updateRole,
    deleteRole,
    refreshRoles: fetchRoles
  };
} 