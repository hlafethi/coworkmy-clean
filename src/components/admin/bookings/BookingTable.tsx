import React from "react";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { BookingRow } from "./BookingRow";
import { type Booking } from "./types";

interface BookingTableProps {
  bookings: Booking[];
  loading: boolean;
  onUpdateStatus: (id: string, status: string) => void;
  onDelete?: (id: string) => void;
}

export const BookingTable: React.FC<BookingTableProps> = ({
  bookings,
  loading,
  onUpdateStatus,
  onDelete
}) => {
  if (loading) {
    return <p className="text-center py-4">Chargement des réservations...</p>;
  }

  if (bookings.length === 0) {
    return <p className="text-center py-4">Aucune réservation trouvée.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Utilisateur</TableHead>
          <TableHead>Espace</TableHead>
          <TableHead>Dates</TableHead>
          <TableHead>Prix</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {bookings.map((booking) => (
          <BookingRow
            key={booking.id}
            booking={booking}
            onUpdateStatus={onUpdateStatus}
            onDelete={onDelete}
          />
        ))}
      </TableBody>
    </Table>
  );
};
