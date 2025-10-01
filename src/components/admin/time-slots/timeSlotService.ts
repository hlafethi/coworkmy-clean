import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import { type TimeSlot } from "../types";

export async function fetchTimeSlots(): Promise<TimeSlot[]> {
  try {
    const result = await apiClient.get('/time-slots');
    
    if (result.success && result.data) {
      return result.data;
    }
    return [];
  } catch (error) {
    console.error('Error fetching time slots:', error);
    toast.error("Impossible de récupérer les créneaux horaires");
    return [];
  }
}

export async function createTimeSlot(timeSlot: Omit<TimeSlot, 'id' | 'created_at' | 'updated_at'>): Promise<TimeSlot | null> {
  try {
    const result = await apiClient.post('/time-slots', timeSlot);
    
    if (result.success && result.data) {
      toast.success("Créneau horaire créé");
      return result.data;
    }
    return null;
  } catch (error) {
    console.error('Error creating time slot:', error);
    toast.error("Impossible de créer le créneau horaire");
    return null;
  }
}

export async function updateTimeSlot(id: string, updates: Partial<Omit<TimeSlot, 'id' | 'created_at' | 'updated_at'>>): Promise<TimeSlot | null> {
  try {
    const result = await apiClient.put(`/time-slots/${id}`, updates);
    
    if (result.success && result.data) {
      toast.success("Créneau horaire mis à jour");
      return result.data;
    }
    return null;
  } catch (error) {
    console.error('Error updating time slot:', error);
    toast.error("Impossible de mettre à jour le créneau horaire");
    return null;
  }
}

export async function deleteTimeSlot(id: string): Promise<boolean> {
  try {
    const result = await apiClient.delete(`/time-slots/${id}`);
    
    if (result.success) {
      toast.success("Créneau horaire supprimé");
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting time slot:', error);
    toast.error("Impossible de supprimer le créneau horaire");
    return false;
  }
}

export async function swapTimeSlotOrders(
  firstSlotId: string,
  firstSlotOrder: number,
  secondSlotId: string,
  secondSlotOrder: number
): Promise<boolean> {
  try {
    // Utiliser l'API pour échanger les ordres
    const result = await apiClient.put('/time-slots/swap-orders', {
      firstSlotId,
      firstSlotOrder,
      secondSlotId,
      secondSlotOrder
    });
    
    if (result.success) {
      toast.success("Ordre des créneaux mis à jour");
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error swapping time slot orders:', error);
    toast.error("Impossible de modifier l'ordre des créneaux");
    return false;
  }
}

export function subscribeToTimeSlots(callback: (payload: any) => void) {
  // Pour PostgreSQL, on peut utiliser polling ou WebSockets
  // Pour l'instant, on retourne un objet avec une méthode unsubscribe
  console.log('Subscription aux créneaux horaires (PostgreSQL)');
  return {
    unsubscribe: () => {
      console.log('Unsubscribed from time slots');
    }
  };
}
