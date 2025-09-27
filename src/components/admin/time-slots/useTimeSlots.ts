import { useState, useEffect } from "react";
import { type TimeSlot } from "../types";
import {
  fetchTimeSlots,
  createTimeSlot,
  updateTimeSlot,
  deleteTimeSlot,
  swapTimeSlotOrders,
} from "./timeSlotService";
import { type TimeSlotFormValues } from "./timeSlotSchema";
import { supabase } from '@/integrations/supabase/client';

// Fonction pour calculer la durée en minutes entre deux heures au format HH:MM
function calculateDuration(startTime: string, endTime: string): number {
  const [startHours, startMinutes] = startTime.split(":").map(Number);
  const [endHours, endMinutes] = endTime.split(":").map(Number);
  
  let durationMinutes = (endHours * 60 + endMinutes) - (startHours * 60 + startMinutes);
  
  // Si la durée est négative (par exemple, de 23:00 à 01:00), ajouter 24 heures
  if (durationMinutes < 0) {
    durationMinutes += 24 * 60;
  }
  
  return durationMinutes;
}

export function useTimeSlots() {
  /* états */
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentTimeSlot, setCurrentTimeSlot] = useState<TimeSlot | undefined>(
    undefined
  );

  /* charge la liste */
  const loadTimeSlots = async () => {
    setLoading(true);
    const data = await fetchTimeSlots();
    setTimeSlots(data);
    setLoading(false);
  };

  useEffect(() => {
    loadTimeSlots();
  }, []);

  /* submit (create | update) */
  const handleSubmit = async (values: TimeSlotFormValues) => {
    if (isEditing && values.id) {
      /* ---- UPDATE ---- */
      const updated = await updateTimeSlot(values.id, {
        label: values.label,
        start_time: values.start_time,
        end_time: values.end_time,
      });

      if (updated) {
        setDialogOpen(false);
        loadTimeSlots();
      }
    } else {
      /* ---- CREATE ---- */
      const nextOrder =
        timeSlots.length > 0
          ? Math.max(...timeSlots.map((s) => s.display_order)) + 1
          : 1;

      const timeSlotData = {
        label: values.label,
        start_time: values.start_time,
        end_time: values.end_time,
        display_order: values.display_order ?? 0,
        // Ajoute des valeurs par défaut pour les champs requis par la table si besoin
        is_available: true,
        price: 0,
        space_id: '',
      };

      const { data, error } = await supabase
        .from('time_slots')
        .insert([timeSlotData])
        .select()
        .single();

      if (data) {
        setDialogOpen(false);
        loadTimeSlots();
      }
    }
  };

  /* helpers UI */
  const handleEdit = (slot: TimeSlot) => {
    setCurrentTimeSlot(slot);
    setIsEditing(true);
    setDialogOpen(true);
  };

  const handleAddNew = () => {
    setCurrentTimeSlot(undefined);
    setIsEditing(false);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce créneau horaire ?")) return;
    const ok = await deleteTimeSlot(id);
    if (ok) loadTimeSlots();
  };

  /* ré‑ordonner */
  const handleMoveUp = async (index: number) => {
    if (index === 0) return;
    const curr = timeSlots[index];
    const prev = timeSlots[index - 1];

    const ok = await swapTimeSlotOrders(
      curr.id,
      curr.display_order,
      prev.id,
      prev.display_order
    );
    if (ok) loadTimeSlots();
  };

  const handleMoveDown = async (index: number) => {
    if (index === timeSlots.length - 1) return;
    const curr = timeSlots[index];
    const next = timeSlots[index + 1];

    const ok = await swapTimeSlotOrders(
      curr.id,
      curr.display_order,
      next.id,
      next.display_order
    );
    if (ok) loadTimeSlots();
  };

  const handleCloseDialog = () => setDialogOpen(false);

  /* expose */
  return {
    timeSlots,
    loading,
    dialogOpen,
    isEditing,
    currentTimeSlot,
    setDialogOpen,
    handleSubmit,
    handleEdit,
    handleAddNew,
    handleDelete,
    handleMoveUp,
    handleMoveDown,
    handleCloseDialog,
  };
}
