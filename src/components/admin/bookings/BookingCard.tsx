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
  const getBookingDuration = (startTime: string, endTime: string, pricingType?: string) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationMs = end.getTime() - start.getTime();
    const diffDays = Math.ceil(durationMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.ceil(durationMs / (1000 * 60 * 60));
    
    // Selon le type de tarification
    switch (pricingType) {
      case 'hourly':
        if (diffHours < 24) return `${diffHours} heure(s)`;
        return `${diffDays} jour(s)`;
      case 'daily':
        return `${diffDays} jour(s)`;
      case 'monthly':
        // Pour les réservations mensuelles, calculer précisément les mois
        const startYear = start.getFullYear();
        const startMonth = start.getMonth();
        const endYear = end.getFullYear();
        const endMonth = end.getMonth();
        
        const monthsDiff = (endYear - startYear) * 12 + (endMonth - startMonth);
        return `${monthsDiff} mois`;
      case 'quarter':
        // Pour les réservations trimestrielles
        const quarterMonths = Math.floor(diffDays / 30);
        return `${Math.ceil(quarterMonths / 3)} trimestre(s)`;
      case 'yearly':
        // Pour les réservations annuelles
        const years = Math.floor(diffDays / 365);
        return `${years} an(s)`;
      default:
        if (diffDays === 1) return '1 jour';
        if (diffDays < 30) return `${diffDays} jours`;
        if (diffDays < 365) return `${Math.ceil(diffDays / 30)} mois`;
        return `${Math.ceil(diffDays / 365)} an(s)`;
    }
  };

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">{booking.space_name || 'Espace inconnu'}</h3>
            <p className="text-sm text-muted-foreground">
              {booking.user_name || 
               (booking.first_name && booking.last_name ? `${booking.first_name} ${booking.last_name}` : null) ||
               booking.user_email || 
               `Utilisateur #${booking.user_id}`}
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
              <span className="text-sm ml-2">{getBookingDuration(booking.start_time, booking.end_time, booking.space_pricing_type)}</span>
            </div>
            <div className="flex items-center">
              <span className="text-sm font-medium">Période:</span>
              <span className="text-sm ml-2">Du {formatDateTime(booking.start_time)} au {formatDateTime(booking.end_time)}</span>
            </div>
          </div>
          
          <div className="mt-auto">
            <div className="border-t pt-3 mb-3">
              {(() => {
                // Les prix en base sont TTC, donc on calcule le HT
                const priceTTC = booking.total_price_ttc;
                const priceHT = Math.round(priceTTC / 1.2 * 100) / 100;
                const tva = priceTTC - priceHT;
                
                return (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Prix HT:</span>
                      <span className="text-sm">{priceHT.toLocaleString('fr-FR')} €</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">TVA (20%):</span>
                      <span className="text-sm">{tva.toLocaleString('fr-FR')} €</span>
                    </div>
                    <div className="flex justify-between items-center font-medium">
                      <span>Total TTC:</span>
                      <span>{priceTTC.toLocaleString('fr-FR')} €</span>
                    </div>
                  </>
                );
              })()}
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
