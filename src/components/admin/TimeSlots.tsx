// src/components/admin/TimeSlots.tsx
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowDown, ArrowUp, Edit, Plus, Trash } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { TimeSlotForm } from "./time-slots/TimeSlotForm";
import { TimeSlotFormValues } from "./time-slots/timeSlotSchema";
// Logger supprimé - utilisation de console directement
/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */
export interface TimeSlot {
  id: string;
  day_of_week: number;
  start_time: string;  // "09:00"
  end_time: string;    // "10:00"
  space_id?: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

/* ------------------------------------------------------------------ */
/* Helpers API                                                        */
/* ------------------------------------------------------------------ */
async function fetchTimeSlots(): Promise<TimeSlot[]> {
  try {
    const result = await apiClient.get('/time-slots');
    
    if (result.success && result.data) {
      return result.data;
    } else {
      console.error('Error fetching time slots:', result.error);
      toast.error("Impossible de récupérer les créneaux horaires");
      return [];
    }
  } catch (error) {
    console.error('Error fetching time slots:', error);
    toast.error("Impossible de récupérer les créneaux horaires");
    return [];
  }
}

async function createTimeSlot(
  data: Omit<TimeSlot, "id" | "created_at" | "updated_at">
): Promise<TimeSlot | null> {
  try {
    const result = await apiClient.post('/time-slots', data);
    
    if (result.success && result.data) {
      return result.data;
    } else {
      console.error('Error creating time slot:', result.error);
      toast.error("Impossible de créer le créneau horaire");
      return null;
    }
  } catch (error) {
    console.error('Error creating time slot:', error);
    toast.error("Impossible de créer le créneau horaire");
    return null;
  }
}

async function updateTimeSlot(
  id: string,
  data: Partial<TimeSlot>
): Promise<TimeSlot | null> {
  try {
    const result = await apiClient.put(`/time-slots/${id}`, data);
    
    if (result.success && result.data) {
      return result.data;
    } else {
      console.error('Error updating time slot:', result.error);
      toast.error("Impossible de mettre à jour le créneau horaire");
      return null;
    }
  } catch (error) {
    console.error('Error updating time slot:', error);
    toast.error("Impossible de mettre à jour le créneau horaire");
    return null;
  }
}

async function deleteTimeSlot(id: string): Promise<boolean> {
  try {
    const result = await apiClient.delete(`/time-slots/${id}`);
    
    if (result.success) {
      return true;
    } else {
      console.error('Error deleting time slot:', result.error);
      toast.error("Impossible de supprimer le créneau horaire");
      return false;
    }
  } catch (error) {
    console.error('Error deleting time slot:', error);
    toast.error("Impossible de supprimer le créneau horaire");
    return false;
  }
}

// Fonction utilitaire pour calculer la durée en minutes entre deux heures HH:MM
function calculateDuration(startTime: string, endTime: string): number {
  const [startHours, startMinutes] = startTime.split(":").map(Number);
  const [endHours, endMinutes] = endTime.split(":").map(Number);
  let durationMinutes = (endHours * 60 + endMinutes) - (startHours * 60 + startMinutes);
  if (durationMinutes < 0) {
    durationMinutes += 24 * 60;
  }
  return durationMinutes;
}

/* ------------------------------------------------------------------ */
/* Hook principal                                                     */
/* ------------------------------------------------------------------ */
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
        duration: calculateDuration(values.start_time, values.end_time),
      });

      if (updated) {
        toast.success("Créneau horaire mis à jour avec succès");
        setDialogOpen(false);
        loadTimeSlots();
      }
    } else {
      /* ---- CREATE ---- */
      const nextOrder =
        timeSlots.length > 0
          ? Math.max(...timeSlots.map((s) => s.display_order)) + 1
          : 1;

      const slotData: any = {
        label: values.label,
        start_time: values.start_time,
        end_time: values.end_time,
        duration: calculateDuration(values.start_time, values.end_time),
        display_order: nextOrder,
        is_available: true,
        price: 0,
      };
      if (values.space_id && values.space_id !== '') {
        slotData.space_id = values.space_id;
      }
      const newSlot = await createTimeSlot(slotData);

      if (newSlot) {
        toast.success("Créneau horaire créé avec succès");
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
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce créneau horaire ?")) {
      const success = await deleteTimeSlot(id);
      if (success) {
        toast.success("Créneau horaire supprimé avec succès");
        loadTimeSlots();
      }
    }
  };

  const handleMoveUp = async (id: string) => {
    const index = timeSlots.findIndex((slot) => slot.id === id);
    if (index > 0) {
      const currentSlot = timeSlots[index];
      const previousSlot = timeSlots[index - 1];

      const updatedCurrent = await updateTimeSlot(currentSlot.id, {
        display_order: previousSlot.display_order,
      });

      const updatedPrevious = await updateTimeSlot(previousSlot.id, {
        display_order: currentSlot.display_order,
      });

      if (updatedCurrent && updatedPrevious) {
        loadTimeSlots();
      }
    }
  };

  const handleMoveDown = async (id: string) => {
    const index = timeSlots.findIndex((slot) => slot.id === id);
    if (index < timeSlots.length - 1) {
      const currentSlot = timeSlots[index];
      const nextSlot = timeSlots[index + 1];

      const updatedCurrent = await updateTimeSlot(currentSlot.id, {
        display_order: nextSlot.display_order,
      });

      const updatedNext = await updateTimeSlot(nextSlot.id, {
        display_order: currentSlot.display_order,
      });

      if (updatedCurrent && updatedNext) {
        loadTimeSlots();
      }
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setCurrentTimeSlot(undefined);
    setIsEditing(false);
  };

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

/* ------------------------------------------------------------------ */
/* Composant principal                                                */
/* ------------------------------------------------------------------ */
export const TimeSlots = () => {
  const {
    timeSlots,
    loading,
    dialogOpen,
    isEditing,
    currentTimeSlot,
    handleSubmit,
    handleEdit,
    handleAddNew,
    handleDelete,
    handleMoveUp,
    handleMoveDown,
    handleCloseDialog
  } = useTimeSlots();

  const defaultTimeSlot = {
    id: '',
    start_time: '',
    end_time: '',
    is_available: true,
    price: 0,
    space_id: '',
    label: '',
    display_order: 0,
    created_at: '',
    updated_at: '',
  };

  const fullCurrentTimeSlot = { ...defaultTimeSlot, ...currentTimeSlot };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Créneaux horaires</CardTitle>
          <Button onClick={handleAddNew} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Ajouter un créneau
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Chargement...</div>
          ) : timeSlots.length === 0 ? (
            <div className="text-center py-4">Aucun créneau horaire défini</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Libellé</TableHead>
                  <TableHead>Début</TableHead>
                  <TableHead>Fin</TableHead>
                  <TableHead>Durée</TableHead>
                  <TableHead>Ordre</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {timeSlots
                  .sort((a, b) => a.display_order - b.display_order)
                  .map((slot) => (
                    <TableRow key={slot.id}>
                      <TableCell>{slot.label}</TableCell>
                      <TableCell>{slot.start_time}</TableCell>
                      <TableCell>{slot.end_time}</TableCell>
                      <TableCell>{slot.duration} min</TableCell>
                      <TableCell>{slot.display_order}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleMoveUp(slot.id)}
                          >
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleMoveDown(slot.id)}
                          >
                            <ArrowDown className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleEdit(slot)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleDelete(slot.id)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <Dialog open={dialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditing ? "Modifier le créneau horaire" : "Ajouter un créneau horaire"}</DialogTitle>
            <DialogDescription>
              {isEditing ? "Modifiez les informations du créneau horaire." : "Ajoutez un nouveau créneau horaire pour la réservation d'espaces."}
            </DialogDescription>
          </DialogHeader>
          <TimeSlotForm
            timeSlot={fullCurrentTimeSlot}
            isEditing={isEditing}
            onSubmit={handleSubmit}
            onCancel={handleCloseDialog}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TimeSlots;
