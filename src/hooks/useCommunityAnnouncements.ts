import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { isValidCommunityAnnouncement } from "@/utils/typeGuards";
import type { CommunityAnnouncement } from "@/components/admin/types";
// Logger supprimé - utilisation de console directement
type CommunityAnnouncementInsert = Omit<CommunityAnnouncement, 'id' | 'created_at' | 'updated_at'>;
type CommunityAnnouncementUpdate = Partial<CommunityAnnouncementInsert>;

export function useCommunityAnnouncements() {
  const [announcements, setAnnouncements] = useState<CommunityAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('community_announcements')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const validAnnouncements = data?.filter(isValidCommunityAnnouncement) || [];
      setAnnouncements(validAnnouncements);
    } catch (error) {
      console.error('Erreur lors de la récupération des annonces:', error);
      setError(error instanceof Error ? error.message : 'Une erreur est survenue');
      toast.error("Erreur lors de la récupération des annonces");
    } finally {
      setLoading(false);
    }
  };

  const createAnnouncement = async (announcement: CommunityAnnouncementInsert) => {
    try {
      const { data, error } = await supabase
        .from('community_announcements')
        .insert(announcement)
        .select()
        .single();

      if (error) throw error;
      if (!data || !isValidCommunityAnnouncement(data)) {
        throw new Error("Erreur lors de la création de l'annonce");
      }

      setAnnouncements(prev => [data, ...prev]);
      toast.success("Annonce créée avec succès");
      return data;
    } catch (error) {
      console.error('Erreur création annonce:', error);
      toast.error("Erreur lors de la création de l'annonce");
      throw error;
    }
  };

  const updateAnnouncement = async (id: string, update: CommunityAnnouncementUpdate) => {
    try {
      const { data, error } = await supabase
        .from('community_announcements')
        .update(update)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      if (!data || !isValidCommunityAnnouncement(data)) {
        throw new Error("Erreur lors de la mise à jour de l'annonce");
      }

      setAnnouncements(prev => 
        prev.map(announcement => 
          announcement.id === id ? data : announcement
        )
      );
      toast.success("Annonce mise à jour avec succès");
      return data;
    } catch (error) {
      console.error('Erreur mise à jour annonce:', error);
      toast.error("Erreur lors de la mise à jour de l'annonce");
      throw error;
    }
  };

  const deleteAnnouncement = async (id: string) => {
    try {
      const { error } = await supabase
        .from('community_announcements')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setAnnouncements(prev => 
        prev.filter(announcement => announcement.id !== id)
      );
      toast.success("Annonce supprimée avec succès");
    } catch (error) {
      console.error('Erreur suppression annonce:', error);
      toast.error("Erreur lors de la suppression de l'annonce");
      throw error;
    }
  };

  return {
    announcements,
    loading,
    error,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    refreshAnnouncements: fetchAnnouncements
  };
} 