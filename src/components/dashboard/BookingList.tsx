import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatPrice } from "@/utils/bookingUtils";
import { Button } from "@/components/ui/button";
import { Edit, X, Calendar, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { updateBookingStatus } from "@/components/admin/bookings/bookingService";
import { toast } from "sonner";
import { formatDateTime } from "@/utils/dateUtils";

interface BookingActivity {
  id: string;
  description: string;
  date: string;
  status: string;
  priceHT: number;
  priceTTC: number;
  startTime?: string;
  endTime?: string;
  spaceName?: string;
  pricingType?: string;
  customLabel?: string;
  total_price_ht: number;
  total_price_ttc: number;
}

interface BookingListProps {
  activities: BookingActivity[];
  getStatusBadge: (status: string) => JSX.Element;
  onUpdate?: () => void;
}

export const BookingList = ({ activities, getStatusBadge, onUpdate }: BookingListProps) => {
  const navigate = useNavigate();

  const handleEdit = (bookingId: string) => {
    navigate(`/booking/edit/${bookingId}`);
  };

  const handleCancel = async (bookingId: string) => {
    try {
      const success = await updateBookingStatus(bookingId, "cancelled");
      if (success) {
        toast.success("Réservation annulée avec succès");
        if (onUpdate) onUpdate();
      }
    } catch (error) {
      console.error("Erreur lors de l'annulation:", error);
      toast.error("Impossible d'annuler la réservation");
    }
  };

  const canModifyBooking = (status: string) => {
    return status !== "cancelled" && status !== "completed";
  };

  // Fonction pour obtenir le libellé du type de tarification
  const getPricingTypeLabel = (pricingType?: string) => {
    if (!pricingType) return "Tarification standard";

    switch (pricingType) {
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
  const getBookingDuration = (startTime?: string, endTime?: string) => {
    if (!startTime || !endTime) return "";

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
    <Card>
      <CardHeader>
        <CardTitle>Réservations récentes</CardTitle>
        <CardDescription>Historique de vos réservations</CardDescription>
      </CardHeader>
      <CardContent>
        {activities.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {activities.map(activity => (
              <Card key={activity.id} className="flex flex-col h-full">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{activity.spaceName || activity.description}</CardTitle>
                      <CardDescription>{activity.date}</CardDescription>
                    </div>
                    <div>{getStatusBadge(activity.status)}</div>
                  </div>
                </CardHeader>
                <CardContent className="flex-grow pb-2">
                  <div className="flex flex-col h-full">
                    <div className="space-y-2 mb-4">
                      {activity.pricingType && (
                        <div className="flex items-center text-sm">
                          <span className="font-medium mr-2">Type:</span>
                          <span>{getPricingTypeLabel(activity.pricingType)}</span>
                        </div>
                      )}
                      {activity.startTime && activity.endTime && (
                        <>
                          <div className="flex items-center text-sm">
                            <Clock className="h-4 w-4 mr-2 text-gray-500" />
                            <span>{getBookingDuration(activity.startTime, activity.endTime)}</span>
                          </div>
                          <div className="flex items-center text-sm">
                            <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                            <span>
                              Du {formatDateTime(activity.startTime)} au {formatDateTime(activity.endTime)}
                            </span>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="mt-auto">
                      {/* Tarifs dynamiques */}
                      {(() => {
                        const priceHT = typeof activity.priceHT === 'number' && activity.priceHT > 0 ? activity.priceHT : activity.total_price_ht;
                        const priceTTC = typeof activity.priceTTC === 'number' && activity.priceTTC > 0 ? activity.priceTTC : activity.total_price_ttc;
                        let label = '';
                        switch (activity.pricingType) {
                          case 'hourly': label = '€/h'; break;
                          case 'daily': label = '€/jour'; break;
                          case 'monthly': label = '€/mois'; break;
                          case 'yearly': label = '€/an'; break;
                          case 'half_day': label = '€/demi-j'; break;
                          case 'quarter': label = '€/trim'; break;
                          case 'custom': label = activity.customLabel || '€'; break;
                          default: label = '€/h';
                        }
                        return (
                          <div className="border-t pt-3 mb-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium">Prix HT:</span>
                              <span className="text-sm">{formatPrice(priceHT)} {label}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium">TVA (20%):</span>
                              <span className="text-sm">{formatPrice(priceTTC - priceHT)} {label}</span>
                            </div>
                            <div className="flex justify-between items-center font-medium">
                              <span>Total TTC:</span>
                              <span>{formatPrice(priceTTC)} {label}</span>
                            </div>
                          </div>
                        );
                      })()}
                      {/* Actions */}
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        {canModifyBooking(activity.status) && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(activity.id)}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Modifier
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleCancel(activity.id)}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Annuler
                            </Button>
                          </>
                        )}
                        {/* Bouton Supprimer toujours visible */}
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            if (window.confirm("Êtes-vous sûr de vouloir supprimer cette réservation ?")) {
                              if (onUpdate) onUpdate(); // Pour rafraîchir la liste après suppression
                              // Appel à la suppression réelle à faire ici si besoin
                            }
                          }}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Supprimer
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-4">
            Vous n'avez pas encore effectué de réservation.
          </p>
        )}
      </CardContent>
    </Card>
  );
};
