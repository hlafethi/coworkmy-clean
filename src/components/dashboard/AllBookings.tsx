import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/utils/dateUtils";
import { Skeleton } from "@/components/ui/skeleton";
import { Edit, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { updateBookingStatus } from "@/components/admin/bookings/bookingService";
import { useUserBookings } from "@/hooks/useUserBookings";
import { formatPrice } from "@/utils/bookingUtils";
import { useState, useEffect } from "react";

interface CardTitleH2Props {
  children: React.ReactNode;
  className?: string;
}

const CardTitleH2 = ({ children, className = "" }: CardTitleH2Props) => (
  <h2 className={`text-2xl ${className}`}>{children}</h2>
);

interface AllBookingsProps {
  onBookingChange?: () => void;
}

export function AllBookings({ onBookingChange }: AllBookingsProps) {
  // Utilisation du hook temps réel pour les réservations utilisateur
  const { bookings, loading, error, refetch } = useUserBookings();
  const navigate = useNavigate();



  const getStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed":
        return "Confirmée";
      case "pending":
        return "En attente";
      case "cancelled":
        return "Annulée";
      case "completed":
        return "Terminée";
      default:
        return status;
    }
  };

  const handleEdit = (bookingId: string) => {
    navigate(`/booking/edit/${bookingId}`);
  };

  const handleCancel = async (bookingId: string) => {
    try {
      const success = await updateBookingStatus(bookingId, "cancelled");
      if (success) {
        // La mise à jour sera gérée automatiquement par le hook temps réel
        console.log("✅ Annulation demandée, mise à jour automatique via WebSocket");
      toast.success("Réservation annulée avec succès");
      refetch();
      onBookingChange?.();
      } else {
        toast.error("Impossible d'annuler la réservation");
      }
    } catch (error) {
      console.error("Erreur lors de l'annulation:", error);
      toast.error("Une erreur est survenue lors de l'annulation");
    }
  };

  const handleDelete = async (bookingId: string) => {
    try {
      const response = await apiClient.delete(`/bookings/${bookingId}`);

      if (!response.success) {
        console.error("Erreur lors de la suppression:", response.error);
        throw new Error(response.error || "Erreur lors de la suppression");
      }
      
      toast.success("Réservation supprimée avec succès");
      refetch();
      onBookingChange?.();
    } catch (error) {
      console.error("❌ Erreur lors de la suppression:", error);
      toast.error("Impossible de supprimer la réservation");
    }
  };

  const canModifyBooking = (status: string) => {
    return status.toLowerCase() !== "cancelled" && status.toLowerCase() !== "completed";
  };

  const getPricingTypeLabel = (pricingType?: string) => {
    switch (pricingType) {
      case 'hourly':
        return 'Tarification horaire';
      case 'daily':
        return 'Tarification journalière';
      case 'monthly':
        return 'Tarification mensuelle';
      case 'yearly':
        return 'Tarification annuelle';
      case 'half_day':
        return 'Demi-journée';
      case 'quarter':
        return 'Trimestrielle';
      case 'custom':
        return 'Tarification personnalisée';
      default:
        return 'Tarification horaire';
    }
  };

  const calculateDuration = (startDate: string, endDate: string, pricingType?: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffMs = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
    
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

  // S'assurer que bookings est un tableau et le trier
  const bookingsArray = Array.isArray(bookings) ? bookings : [];
  const sortedBookings = bookingsArray.sort((a, b) => {
    const aEndTime = new Date(a.end_time);
    const bEndTime = new Date(b.end_time);
    const now = new Date();
    
    const aIsFuture = aEndTime > now;
    const bIsFuture = bEndTime > now;
    
    if (aIsFuture && !bIsFuture) return -1;
    if (!aIsFuture && bIsFuture) return 1;
    
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });



  if (loading) {
    return <Skeleton className="h-40 w-full" />;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {sortedBookings.map((booking) => {
        const endTime = new Date(booking.end_date);
        const now = new Date();
        const isPast = endTime < now;
        
        return (
          <Card key={booking.id} className={`flex flex-col h-full ${isPast ? 'opacity-75' : ''}`}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitleH2>{booking.space_name}</CardTitleH2>
                  <CardDescription>
                    {formatDateTime(booking.start_time || booking.start_date)}
                    {booking.end_time && (
                      <span className="text-gray-500 ml-2">
                        au {formatDateTime(booking.end_time)}
                      </span>
                    )}
                    {isPast && <span className="text-gray-500 ml-2">(Terminée)</span>}
                  </CardDescription>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(booking.status)}`}>
                  {getStatusLabel(booking.status)}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              {/* Informations sur le type de tarification et la durée */}
              <div className="mb-3">
                <div className="flex justify-between items-center text-sm text-gray-600">
                  <span>Type:</span>
                  <span className="font-medium">{getPricingTypeLabel(booking.pricing_type)}</span>
                </div>
                <div className="flex justify-between items-center text-sm text-gray-600">
                  <span>Durée:</span>
                  <span className="font-medium">{calculateDuration(booking.start_time || booking.start_date, booking.end_time || booking.end_date, booking.pricing_type)}</span>
                </div>
              </div>
              
              {/* Affichage dynamique du prix selon le type de tarification */}
              <div className="border-t pt-3 mb-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Prix HT:</span>
                  <span className="text-sm">{formatPrice(parseFloat(booking.total_price_ht || booking.total_price || 0))}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">TVA (20%):</span>
                  <span className="text-sm">{formatPrice(parseFloat(booking.total_price_ht || booking.total_price || 0) * 0.2)}</span>
                </div>
                <div className="flex justify-between items-center font-medium">
                  <span>Total TTC:</span>
                  <span>{formatPrice(parseFloat(booking.total_price_ttc || booking.total_price || 0))}</span>
                </div>
              </div>
              {/* Actions */}
              <div className="flex items-center justify-end gap-2">
                {canModifyBooking(booking.status) && !isPast && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(booking.id)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Modifier
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleCancel(booking.id)}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Annuler
                    </Button>
                  </>
                )}
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette réservation ?")) {
                      handleDelete(booking.id);
                    }
                  }}
                >
                  <X className="h-4 w-4 mr-1" />
                  Supprimer
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export default AllBookings; 