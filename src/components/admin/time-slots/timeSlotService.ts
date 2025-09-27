import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { type TimeSlot } from "../types";

export async function fetchTimeSlots(): Promise<TimeSlot[]> {
  try {
    const { data, error } = await supabase
      .from('time_slots')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching time slots:', error);
    toast.error("Impossible de récupérer les créneaux horaires");
    return [];
  }
}

export async function createTimeSlot(timeSlot: Omit<TimeSlot, 'id' | 'created_at' | 'updated_at'>): Promise<TimeSlot | null> {
  try {
    const { data, error } = await supabase
      .from('time_slots')
      .insert([timeSlot])
      .select()
      .single();

    if (error) throw error;
    toast.success("Créneau horaire créé");
    return data;
  } catch (error) {
    console.error('Error creating time slot:', error);
    toast.error("Impossible de créer le créneau horaire");
    return null;
  }
}

export async function updateTimeSlot(id: string, updates: Partial<Omit<TimeSlot, 'id' | 'created_at' | 'updated_at'>>): Promise<TimeSlot | null> {
  try {
    const { data, error } = await supabase
      .from('time_slots')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    toast.success("Créneau horaire mis à jour");
    return data;
  } catch (error) {
    console.error('Error updating time slot:', error);
    toast.error("Impossible de mettre à jour le créneau horaire");
    return null;
  }
}

export async function deleteTimeSlot(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('time_slots')
      .delete()
      .eq('id', id);

    if (error) throw error;
    toast.success("Créneau horaire supprimé");
    return true;
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
    // Update the first time slot with the second's order
    const { error: error1 } = await supabase
      .from('time_slots')
      .update({ display_order: secondSlotOrder })
      .eq('id', firstSlotId);

    if (error1) throw error1;

    // Update the second time slot with the first's order
    const { error: error2 } = await supabase
      .from('time_slots')
      .update({ display_order: firstSlotOrder })
      .eq('id', secondSlotId);

    if (error2) throw error2;

    toast.success("Ordre des créneaux mis à jour");
    return true;
  } catch (error) {
    console.error('Error swapping time slot orders:', error);
    toast.error("Impossible de modifier l'ordre des créneaux");
    return false;
  }
}

export function subscribeToTimeSlots(callback: (payload: any) => void) {
  return supabase
    .channel('time_slots_channel')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'time_slots' },
      callback
    )
    .subscribe();
}
