import React from "react";

interface BookingStatusBadgeProps {
  status: string;
}

export const BookingStatusBadge: React.FC<BookingStatusBadgeProps> = ({ status }) => {
  switch (status) {
    case 'confirmed':
      return <span className="px-2 py-1 rounded bg-green-50 text-green-700 text-xs font-medium border border-green-200">Confirmée</span>;
    case 'cancelled':
      return <span className="px-2 py-1 rounded bg-red-50 text-red-700 text-xs font-medium border border-red-200">Annulée</span>;
    case 'completed':
      return <span className="px-2 py-1 rounded bg-blue-50 text-blue-700 text-xs font-medium border border-blue-200">Terminée</span>;
    default:
      return <span className="px-2 py-1 rounded bg-yellow-50 text-yellow-700 text-xs font-medium border border-yellow-200">En attente</span>;
  }
};
