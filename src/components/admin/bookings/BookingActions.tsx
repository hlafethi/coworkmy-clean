import React from "react";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";

interface BookingActionsProps {
  bookingId: string;
  status: string;
  onUpdateStatus: (id: string, status: string) => void;
  onDelete?: (id: string) => void;
}

export const BookingActions: React.FC<BookingActionsProps> = ({
  bookingId,
  status,
  onUpdateStatus,
  onDelete
}) => {
  return (
    <div className="flex justify-end gap-2">
      {status === 'pending' && (
        <>
          <Button
            variant="default"
            size="sm"
            onClick={() => onUpdateStatus(bookingId, 'confirmed')}
          >
            <Check size={16} className="mr-1" />
            Confirmer
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onUpdateStatus(bookingId, 'cancelled')}
          >
            <X size={16} className="mr-1" />
            Annuler
          </Button>
        </>
      )}
      {status === 'confirmed' && (
        <Button
          variant="destructive"
          size="sm"
          onClick={() => onUpdateStatus(bookingId, 'cancelled')}
        >
          <X size={16} className="mr-1" />
          Annuler
        </Button>
      )}
      {status === 'cancelled' && (
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onUpdateStatus(bookingId, 'confirmed')}
          >
            <Check size={16} className="mr-1" />
            Réactiver
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              if (onDelete && window.confirm("Supprimer définitivement cette réservation ?")) {
                onDelete(bookingId);
              }
            }}
          >
            <X size={16} className="mr-1" />
            Supprimer
          </Button>
        </>
      )}
    </div>
  );
};
