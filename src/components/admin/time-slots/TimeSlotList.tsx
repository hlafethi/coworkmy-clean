import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowUp, ArrowDown, Edit, Trash2 } from "lucide-react";
import { type TimeSlot } from "../types";

interface TimeSlotListProps {
  timeSlots: TimeSlot[];
  loading: boolean;
  onEdit: (timeSlot: TimeSlot) => void;
  onDelete: (id: string) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
}

export function TimeSlotList({
  timeSlots,
  loading,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown
}: TimeSlotListProps) {
  if (loading) {
    return <p className="text-center py-4">Chargement des créneaux horaires...</p>;
  }

  if (timeSlots.length === 0) {
    return <p className="text-center py-4">Aucun créneau horaire configuré.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Libellé</TableHead>
          <TableHead>Heure de début</TableHead>
          <TableHead>Heure de fin</TableHead>
          <TableHead>Ordre</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {timeSlots.map((slot, index) => (
          <TableRow key={slot.id}>
            <TableCell>{slot.label}</TableCell>
            <TableCell>{slot.start_time}</TableCell>
            <TableCell>{slot.end_time}</TableCell>
            <TableCell>{slot.display_order}</TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onMoveUp(index)}
                  disabled={index === 0}
                  aria-label={`Déplacer le créneau ${slot.start_time} vers le haut`}
                >
                  <ArrowUp className="h-4 w-4" aria-hidden="true" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onMoveDown(index)}
                  disabled={index === timeSlots.length - 1}
                  aria-label={`Déplacer le créneau ${slot.start_time} vers le bas`}
                >
                  <ArrowDown className="h-4 w-4" aria-hidden="true" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(slot)}
                  aria-label={`Modifier le créneau ${slot.start_time}`}
                >
                  <Edit className="h-4 w-4" aria-hidden="true" />
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onDelete(slot.id)}
                  aria-label={`Supprimer le créneau ${slot.start_time}`}
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
