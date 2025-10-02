import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { withRetry } from "@/utils/supabaseUtils";
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

export function MyBookings() {
  // Utilisation du hook temps réel pour les réservations utilisateur
  const { bookings, loading, error, refetch } = useUserBookings();
  const navigate = useNavigate();

  // Debug: Log des changements de réservations
  useEffect(() => {
    console.log(`🔄 MyBookings - Réservations mises à jour: ${bookings.length}`);
  }, [bookings]);

  const getStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
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
        toast.success("Réservation annulée avec succès");
        refetch();
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
      console.log(`🗑️ Suppression de la réservation: ${bookingId}`);
      
      const { error } = await supabase
          .from("bookings")
          .delete()
          .eq("id", bookingId);

      if (error) {
        console.error("❌ Erreur Supabase:", error);
        throw error;
      }

      console.log("✅ Réservation supprimée de la base de données");
      
      // La suppression sera gérée automatiquement par le hook temps réel
      console.log("✅ Suppression demandée, mise à jour automatique via WebSocket");

      toast.success("Réservation supprimée avec succès");
    } catch (error) {
      console.error("❌ Erreur lors de la suppression:", error);
      toast.error("Impossible de supprimer la réservation");
    }
  };

  const canModifyBooking = (status: string) => {
    return status.toLowerCase() !== "cancelled" && status.toLowerCase() !== "completed";
  };

  if (loading) {
    return <Skeleton className="h-40 w-full" />;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  // Filtrer les réservations à venir (date de fin > maintenant)
  const upcomingBookings = bookings.filter(booking => {
    const endTime = new Date(booking.end_time);
    const now = new Date();
    return endTime > now;
  });

  console.log(`📊 MyBookings - Total réservations: ${bookings.length}, Réservations à venir: ${upcomingBookings.length}`);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {upcomingBookings.map((booking) => (
        <Card key={booking.id} className="flex flex-col h-full">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitleH2>{booking.space_name}</CardTitleH2>
                <CardDescription>
                  {formatDateTime(booking.start_date)}
                </CardDescription>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(booking.status)}`}>
                {getStatusLabel(booking.status)}
              </span>
            </div>
            {/* Affichage du statut brut pour debug */}
            <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>status brut: {booking.status}</div>
          </CardHeader>
          <CardContent>
            {/* Affichage dynamique du prix selon le type de tarification */}
            <div className="border-t pt-3 mb-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Prix HT:</span>
                <span className="text-sm">{formatPrice(parseFloat(booking.total_price_ht || booking.total_price))} €</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">TVA (20%):</span>
                <span className="text-sm">{formatPrice(parseFloat(booking.total_price_ttc || booking.total_price * 1.2) - parseFloat(booking.total_price_ht || booking.total_price))} €</span>
              </div>
              <div className="flex justify-between items-center font-medium">
                <span>Total TTC:</span>
                <span>{formatPrice(parseFloat(booking.total_price_ttc || booking.total_price * 1.2))} €</span>
              </div>
            </div>
            {/* Actions */}
            <div className="flex items-center justify-end gap-2">
              {canModifyBooking(booking.status) && (
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
      ))}
    </div>
  );
}

export default MyBookings;
