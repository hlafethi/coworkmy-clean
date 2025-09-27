import React from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { BookingStatusBadge } from "./BookingStatusBadge";
import { UserInfo } from "./UserInfo";
import { SpaceInfo } from "./SpaceInfo";
import { BookingDates } from "./BookingDates";
import { BookingActions } from "./BookingActions";
import { type Booking } from "./types";

interface BookingRowProps {
  booking: Booking;
  onUpdateStatus: (id: string, status: string) => void;
  onDelete?: (id: string) => void;
}

export const BookingRow: React.FC<BookingRowProps> = ({ booking, onUpdateStatus, onDelete }) => {
  return (
    <TableRow>
      <TableCell>
        <UserInfo userName={booking.user_name || 'Utilisateur inconnu'} />
      </TableCell>
      <TableCell>
        <SpaceInfo spaceName={booking.space_name || 'Espace inconnu'} />
      </TableCell>
      <TableCell>
        <BookingDates startTime={booking.start_time} endTime={booking.end_time} />
      </TableCell>
      <TableCell>
        <div className="flex flex-col">
          <span className="text-sm">HT: {booking.total_price_ht.toLocaleString('fr-FR')} €</span>
          <span className="text-sm font-medium">TTC: {booking.total_price_ttc.toLocaleString('fr-FR')} €</span>
        </div>
      </TableCell>
      <TableCell>
        <BookingStatusBadge status={booking.status} />
      </TableCell>
      <TableCell className="text-right">
        <BookingActions
          bookingId={booking.id}
          status={booking.status}
          onUpdateStatus={onUpdateStatus}
          onDelete={onDelete}
        />
      </TableCell>
    </TableRow>
  );
};
