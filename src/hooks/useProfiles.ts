import { supabase } from "@/integrations/supabase/client";
import { isValidProfile } from "@/utils/typeGuards";
import type { Database } from "@/integrations/supabase/types";
import { logger } from '@/utils/logger';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export const useProfiles = () => {
    const getProfiles = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            return data?.filter(isValidProfile) || [];
        } catch (error) {
            logger.error('Erreur récupération profils:', error);
            throw error;
        }
    };

    const getProfileById = async (id: string) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', id as ProfileRow['id'])
                .single();

            if (error) throw error;
            if (!data || !isValidProfile(data)) {
                throw new Error("Profil non trouvé");
            }

            return data;
        } catch (error) {
            logger.error('Erreur récupération profil:', error);
            throw error;
        }
    };

    const createProfile = async (profile: ProfileInsert) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .insert(profile)
                .select()
                .single();

            if (error) throw error;
            if (!data || !isValidProfile(data)) {
                throw new Error("Erreur lors de la création du profil");
            }

            return data;
        } catch (error) {
            logger.error('Erreur création profil:', error);
            throw error;
        }
    };

    const updateProfile = async (id: string, updates: ProfileUpdate) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', id as ProfileRow['id'])
                .select()
                .single();

            if (error) throw error;
            if (!data || !isValidProfile(data)) {
                throw new Error("Erreur lors de la mise à jour du profil");
            }

            return data;
        } catch (error) {
            logger.error('Erreur mise à jour profil:', error);
            throw error;
        }
    };

    const deleteProfile = async (id: string) => {
        try {
            const { error } = await supabase
                .from('profiles')
                .delete()
                .eq('id', id as ProfileRow['id']);

            if (error) throw error;
        } catch (error) {
            logger.error('Erreur suppression profil:', error);
            throw error;
        }
    };

    return {
        getProfiles,
        getProfileById,
        createProfile,
        updateProfile,
        deleteProfile
    };
}; 