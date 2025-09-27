
import React from "react";
import { Calendar } from "lucide-react";

interface BookingDatesProps {
  startTime: string;
  endTime: string;
}

export const BookingDates: React.FC<BookingDatesProps> = ({ startTime, endTime }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="flex items-center gap-2">
      <Calendar className="h-4 w-4 text-gray-400" />
      <div className="flex flex-col">
        <span className="text-xs">Début: {formatDate(startTime)}</span>
        <span className="text-xs">Fin: {formatDate(endTime)}</span>
      </div>
    </div>
  );
};
