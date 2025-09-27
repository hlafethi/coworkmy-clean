import React from "react";
import { BookingCard } from "./BookingCard";
import { Skeleton } from "@/components/ui/skeleton";
import { type Booking } from "./types";

interface BookingGridProps {
  bookings: Booking[];
  loading: boolean;
  onUpdateStatus: (id: string, status: string) => void;
}

export const BookingGrid: React.FC<BookingGridProps> = ({ 
  bookings, 
  loading, 
  onUpdateStatus 
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Aucune réservation trouvée
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {bookings.map((booking) => (
        <BookingCard
          key={booking.id}
          booking={booking}
          onUpdateStatus={onUpdateStatus}
        />
      ))}
    </div>
  );
};
