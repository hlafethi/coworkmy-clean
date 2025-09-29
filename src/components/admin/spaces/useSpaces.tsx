import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import type { Space } from "@/components/admin/types";

export interface SpaceFormData {
  id?: string;
  name: string;
  description: string;
  capacity: number;
  hourly_price: number;
  daily_price: number;
  half_day_price: number;
  monthly_price: number;
  quarter_price: number;
  yearly_price: number;
  custom_price: number;
  custom_label: string;
  pricing_type: 'hourly' | 'daily' | 'half_day' | 'monthly' | 'quarter' | 'yearly' | 'custom';
  amenities: string[];
  image_url?: string;
  is_active: boolean;
  time_slots?: Array<{
    id: string;
    startTime: string;
    endTime: string;
    label: string;
  }>;
}

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
      
      const response = await apiClient.get('/spaces');
      
      if (response.success && response.data) {
        const spacesData = Array.isArray(response.data) ? response.data : [];
        console.log("Spaces fetched raw data:", spacesData);

        // Process and validate data for all spaces
        const processedSpaces = spacesData?.map(space => {
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
      } else {
        console.log("No spaces data available");
        setSpaces([]);
      }
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
      amenities: space.amenities || [],
      image_url: space.image_url,
      is_active: space.is_active
    });
    setEditDialogOpen(true);
  };

  const handleAddClick = () => {
    console.log("Adding new space");
    setSelectedSpace({
      name: '',
      description: '',
      capacity: 1,
      hourly_price: 0,
      daily_price: 0,
      half_day_price: 0,
      monthly_price: 0,
      quarter_price: 0,
      yearly_price: 0,
      custom_price: 0,
      custom_label: '',
      pricing_type: 'hourly',
      amenities: [],
      is_active: true
    });
    setAddDialogOpen(true);
  };

  const handleDeleteClick = async (spaceId: string) => {
    try {
      console.log("Deleting space:", spaceId);
      
      const response = await apiClient.delete(`/spaces/${spaceId}`);
      
      if (response.success) {
        toast.success("Espace supprimé avec succès");
        triggerRefresh();
      } else {
        throw new Error(response.error || "Erreur lors de la suppression");
      }
    } catch (error) {
      console.error('Error deleting space:', error);
      toast.error("Impossible de supprimer l'espace");
    }
  };

  const handleDialogClose = () => {
    setAddDialogOpen(false);
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
    setSelectedSpace,
    handleEditClick,
    handleAddClick,
    handleDeleteClick,
    handleDialogClose,
    triggerRefresh
  };
};