import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Space } from "@/components/admin/types";

export const useSpaces = () => {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedSpace, setSelectedSpace] = useState<SpaceFormData | null>(null);
  // Add refresh trigger state
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const fetchSpaces = async () => {
    try {
      setLoading(true);
      console.log("Fetching spaces...");
      
      const { data, error } = await supabase
        .from('spaces')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      console.log("Spaces fetched raw data:", data);

      // Process and validate data for all spaces
      const processedSpaces = data?.map(space => {
        console.log(`Space ${space.name} pricing_type:`, space.pricing_type);
        return {
          ...space,
          pricing_type: space.pricing_type || 'hourly',
          hourly_price: Number(space.hourly_price) || 0,
          daily_price: Number(space.daily_price) || 0,
          half_day_price: Number(space.half_day_price) || 0,
          monthly_price: Number(space.monthly_price) || 0,
          quarter_price: Number(space.quarter_price) || 0,
          yearly_price: Number(space.yearly_price) || 0,
          custom_price: Number(space.custom_price) || 0,
          custom_label: space.custom_label || ''
        };
      }) as Space[];

      console.log("Processed spaces data:", processedSpaces);
      setSpaces(processedSpaces);
    } catch (error) {
      console.error('Error fetching spaces:', error);
      toast.error("Impossible de récupérer les espaces");
    } finally {
      setLoading(false);
    }
  };

  // Trigger a refresh
  const triggerRefresh = () => {
    console.log("Triggering refresh of spaces list");
    setRefreshTrigger(prev => prev + 1);
  };

  // Fetch spaces whenever refreshTrigger changes
  useEffect(() => {
    fetchSpaces();
  }, [refreshTrigger]);

  const handleEditClick = (space: Space) => {
    console.log("Editing space:", space);
    setSelectedSpace({
      id: space.id,
      name: space.name,
      description: space.description,
      capacity: space.capacity,
      hourly_price: Number(space.hourly_price) || 0,
      daily_price: Number(space.daily_price) || 0,
      half_day_price: Number(space.half_day_price) || 0,
      monthly_price: Number(space.monthly_price) || 0,
      quarter_price: Number(space.quarter_price) || 0,
      yearly_price: Number(space.yearly_price) || 0,
      custom_price: Number(space.custom_price) || 0,
      custom_label: space.custom_label || '',
      pricing_type: space.pricing_type || 'hourly',
      is_active: space.is_active,
      image_url: space.image_url || ""
    });
    setEditDialogOpen(true);
  };

  // Fonction pour fermer le dialogue d'édition et nettoyer l'état
  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setSelectedSpace(null);
  };

  return {
    spaces,
    loading,
    addDialogOpen,
    setAddDialogOpen,
    editDialogOpen,
    setEditDialogOpen,
    selectedSpace,
    fetchSpaces,
    triggerRefresh,
    handleEditClick,
    handleCloseEditDialog
  };
};
