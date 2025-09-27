import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { BookingStatusBadge } from "./BookingStatusBadge";
import { BookingActions } from "./BookingActions";
import { type Booking } from "./types";
import { formatDateTime } from "@/utils/dateUtils";

interface BookingCardProps {
  booking: Booking;
  onUpdateStatus: (id: string, status: string) => void;
}

export const BookingCard: React.FC<BookingCardProps> = ({ booking, onUpdateStatus }) => {
  // Fonction pour obtenir le libellé du type de tarification
  const getPricingTypeLabel = (pricingType: string) => {
    switch(pricingType) {
      case "hourly": return "Tarification horaire";
      case "daily": return "Tarification journalière";
      case "half_day": return "Tarification demi-journée";
      case "quarter": return "Tarification trimestrielle";
      case "monthly": return "Tarification mensuelle";
      case "yearly": return "Tarification annuelle";
      case "custom": return "Tarification personnalisée";
      default: return "Tarification inconnue";
    }
  };

  // Fonction pour calculer la durée de la réservation
  const getBookingDuration = (startTime: string, endTime: string) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationMs = end.getTime() - start.getTime();
    const hours = Math.round(durationMs / (1000 * 60 * 60));
    
    if (hours < 24) {
      return `${hours} heure${hours > 1 ? 's' : ''}`;
    } else {
      const days = Math.round(hours / 24);
      return `${days} jour${days > 1 ? 's' : ''}`;
    }
  };

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">{booking.space_name || 'Espace inconnu'}</h3>
            <p className="text-sm text-muted-foreground">
              {booking.user_name || 'Utilisateur inconnu'}
            </p>
          </div>
          <BookingStatusBadge status={booking.status} />
        </div>
      </CardHeader>
      <CardContent className="flex-grow pb-2">
        <div className="flex flex-col h-full">
          <div className="space-y-1 mb-4">
            <div className="flex items-center">
              <span className="text-sm font-medium">Type:</span>
              <span className="text-sm ml-2">{getPricingTypeLabel(booking.space_pricing_type || 'hourly')}</span>
            </div>
            <div className="flex items-center">
              <span className="text-sm font-medium">Durée:</span>
              <span className="text-sm ml-2">{getBookingDuration(booking.start_time, booking.end_time)}</span>
            </div>
            <div className="flex items-center">
              <span className="text-sm font-medium">Période:</span>
              <span className="text-sm ml-2">Du {formatDateTime(booking.start_time)} au {formatDateTime(booking.end_time)}</span>
            </div>
          </div>
          
          <div className="mt-auto">
            <div className="border-t pt-3 mb-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Prix HT:</span>
                <span className="text-sm">{booking.total_price_ht.toLocaleString('fr-FR')} €</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">TVA (20%):</span>
                <span className="text-sm">{(booking.total_price_ttc - booking.total_price_ht).toLocaleString('fr-FR')} €</span>
              </div>
              <div className="flex justify-between items-center font-medium">
                <span>Total TTC:</span>
                <span>{booking.total_price_ttc.toLocaleString('fr-FR')} €</span>
              </div>
            </div>
            
            <div className="flex items-center justify-end">
              <BookingActions 
                bookingId={booking.id} 
                status={booking.status} 
                onUpdateStatus={onUpdateStatus} 
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
