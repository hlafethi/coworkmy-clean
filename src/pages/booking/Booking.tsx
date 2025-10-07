import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useBooking } from "@/hooks/useBooking";
import { DateRangeSelector } from "@/components/booking/DateRangeSelector";
import { TimeSlotSelector } from "@/components/booking/TimeSlotSelector";
import { BookingSummary } from "@/components/booking/BookingSummary";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import type { TimeSlotOption } from "@/types/booking";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
// Logger supprimé - utilisation de console directement
import { toast } from "sonner";
import { useStripePayment } from "@/hooks/useStripePayment";
import { useAuth } from "@/context/AuthContextPostgreSQL";
import { apiClient } from "@/lib/api-client";
import { updateBookingStatus } from '@/utils/stripeUtils';

export default function Booking() {
  const { spaceId } = useParams<{ spaceId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const { space, loading, timeSlots, selectedSlot, setSelectedSlot } = useBooking(spaceId);
  const [selectedDays, setSelectedDays] = useState<Date[]>([]);
  const [selectedDateRange, setSelectedDateRange] = useState<{ from: Date; to: Date } | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const { createPaymentSession } = useStripePayment();

  console.log("📍 Page Booking - spaceId:", spaceId);
  console.log("📍 Location state:", location.state);

  useEffect(() => {
    if (spaceId) {
      if (space) {
        // Initialiser avec la date d'aujourd'hui pour les réservations
        const today = new Date();
        setSelectedDays([today]);
        setSelectedDateRange({ from: today, to: today });
        // setSelectedSlot est géré par le hook useBooking
      } else {
        setErrorDetails("Impossible de charger les informations de l'espace. Veuillez réessayer.");
      }
    } else {
      setErrorDetails("ID de l'espace manquant dans l'URL");
    }
  }, [spaceId]);

  console.log("Loader state:", { loading });

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-lg">Chargement...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!space) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate("/spaces")}
          className="flex items-center gap-2 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux espaces
        </Button>
        
        <Alert variant="destructive">
          <AlertTitle>Une erreur est survenue</AlertTitle>
          <AlertDescription>
            {errorDetails || "Une erreur inattendue s'est produite. Veuillez réessayer."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const handleSlotSelect = (slot: TimeSlotOption) => {
    setSelectedSlot(slot);
  };

  const handleSubmit = async () => {
    if (!space || !selectedSlot || selectedDays.length === 0) {
      toast.error("Veuillez sélectionner un créneau et une date");
      return;
    }

    if (!termsAccepted) {
      toast.error("Veuillez accepter les conditions générales");
      return;
    }

    try {
      if (!user) {
        toast.error("Vous devez être connecté pour effectuer une réservation");
        navigate("/auth/login");
        return;
      }

      const startTime = new Date(selectedDays[0]);
      startTime.setHours(parseInt(selectedSlot.startTime.split(':')[0]));
      startTime.setMinutes(parseInt(selectedSlot.startTime.split(':')[1]));

      // Calculer la date de fin selon le type de tarification
      let endTime: Date;
      if (space.pricing_type === 'monthly') {
        // Pour les réservations mensuelles : ajouter un mois moins un jour
        endTime = new Date(selectedDays[0]);
        endTime.setMonth(endTime.getMonth() + 1);
        endTime.setDate(endTime.getDate() - 1);
        endTime.setHours(23, 59, 59, 999); // Fin de journée
      } else if (space.pricing_type === 'quarter') {
        // Pour les réservations trimestrielles : ajouter 3 mois moins un jour
        endTime = new Date(selectedDays[0]);
        endTime.setMonth(endTime.getMonth() + 3);
        endTime.setDate(endTime.getDate() - 1);
        endTime.setHours(23, 59, 59, 999);
      } else if (space.pricing_type === 'yearly') {
        // Pour les réservations annuelles : ajouter un an moins un jour
        endTime = new Date(selectedDays[0]);
        endTime.setFullYear(endTime.getFullYear() + 1);
        endTime.setDate(endTime.getDate() - 1);
        endTime.setHours(23, 59, 59, 999);
      } else {
        // Pour les autres types (horaire, journalier, demi-journée) : même jour
        endTime = new Date(selectedDays[0]);
        endTime.setHours(parseInt(selectedSlot.endTime.split(':')[0]));
        endTime.setMinutes(parseInt(selectedSlot.endTime.split(':')[1]));
      }

      // Vérifier la disponibilité de l'espace avant de créer la réservation
      const availabilityCheck = await apiClient.get(`/spaces/${space.id}/availability?start=${startTime.toISOString()}&end=${endTime.toISOString()}`);
      
      if (!availabilityCheck.success || !availabilityCheck.data.available) {
        toast.error("Cet espace est déjà réservé pour cette période");
        return;
      }

      // 1. Créer la réservation en pending via l'API
      // Utiliser le prix de l'espace si le slot n'a pas de prix défini
      const slotPrice = selectedSlot.price || space.price_per_hour || 0;
      
      // Le prix du slot est maintenant TTC (après multiplication par 1.2 dans useBooking)
      const priceTTC = slotPrice;
      const priceHT = Math.round(slotPrice / 1.2 * 100) / 100;
      
      const bookingData = {
        user_id: user.id,
        space_id: space.id,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        status: 'pending',
        total_price_ht: priceHT,
        total_price_ttc: priceTTC,
        description: `Réservation pour ${space.name}`,
        attendees: 1
      };


      const bookingResponse = await apiClient.post('/bookings', bookingData);

      if (!bookingResponse.success) {
        throw new Error(bookingResponse.error || 'Erreur lors de la création de la réservation');
      }

      const booking = bookingResponse.data;

      console.log('✅ Réservation créée avec succès:', booking);
      
      // Vérifier si l'utilisateur est admin
      const isAdmin = user?.is_admin;
      
      if (isAdmin) {
        // Pour les admins, créer une session de paiement Stripe
        try {
          const userEmail = user.email || 'admin@coworkmy.fr';
          
          // Créer une session de paiement Stripe
          const { url, mode } = await createPaymentSession(
            booking.id,
            Math.round(bookingData.total_price_ttc * 100), // Convertir en centimes
            userEmail,
            {
              booking_id: booking.id,
              space_name: space.name,
              start_time: bookingData.start_time,
              end_time: bookingData.end_time
            }
          );
          
          // Rediriger vers la page de paiement Stripe
          toast.info("Redirection vers la page de paiement...");
          window.location.href = url;
          return; // Arrêter l'exécution ici
        } catch (paymentError) {
          console.error("Erreur lors de la création de la session de paiement:", paymentError);
          toast.error("Impossible de créer la session de paiement. Réservation créée sans paiement.");
          
          // Rediriger vers le dashboard admin
          navigate('/admin');
          return;
        }
      } else {
        // Pour les utilisateurs normaux, créer une session de paiement Stripe
        try {
          const userEmail = user.email || 'client@example.com';
          
          const { url, mode } = await createPaymentSession(
            booking.id,
            Math.round(bookingData.total_price_ttc * 100), // Convertir en centimes
            userEmail,
            {
              booking_id: booking.id,
              space_name: space.name,
              start_time: bookingData.start_time,
              end_time: bookingData.end_time
            }
          );
          
          // Rediriger vers la page de paiement Stripe
          toast.info("Redirection vers la page de paiement...");
          window.location.href = url;
          return; // Arrêter l'exécution ici
        } catch (paymentError) {
          console.error("Erreur lors de la création de la session de paiement:", paymentError);
          toast.error("Impossible de créer la session de paiement. Veuillez réessayer.");
          
          // En cas d'erreur, mettre à jour le statut de la réservation à "cancelled"
          try {
            await updateBookingStatus(booking.id, 'cancelled');
          } catch (updateError) {
            console.warn("Erreur lors de l'annulation de la réservation:", updateError);
          }
          
          return;
        }
      }
    } catch (error) {
      toast.error("Une erreur est survenue lors de la réservation ou du paiement.");
      console.error("Erreur lors de la création de la réservation ou du paiement:", error);
    }
  };

  const currentSpace = space;
  const currentSelectedSpace = space;
  const mappedSpace = currentSelectedSpace ? ({
    id: currentSelectedSpace.id,
    name: currentSelectedSpace.name,
    description: currentSelectedSpace.description ?? '',
    capacity: currentSelectedSpace.capacity ?? 0,
    image_url: (currentSelectedSpace as any).image_url ?? '',
    is_available: (currentSelectedSpace as any).is_available ?? true,
    created_at: (currentSelectedSpace as any).created_at ?? '',
    updated_at: (currentSelectedSpace as any).updated_at ?? '',
    pricing_type: (currentSelectedSpace as any).pricing_type ?? 'hourly',
    hourly_price: (currentSelectedSpace as any).hourly_price ?? 0,
    daily_price: (currentSelectedSpace as any).daily_price ?? 0,
    monthly_price: (currentSelectedSpace as any).monthly_price ?? 0,
    yearly_price: (currentSelectedSpace as any).yearly_price ?? 0,
    half_day_price: (currentSelectedSpace as any).half_day_price ?? 0,
    quarter_price: (currentSelectedSpace as any).quarter_price ?? 0,
    custom_price: (currentSelectedSpace as any).custom_price ?? 0,
    custom_label: (currentSelectedSpace as any).custom_label ?? '',
    price: (currentSelectedSpace as any).price ?? 0,
  } as any) : undefined;

  console.log("📍 Espace actuel:", currentSpace);
  console.log("📍 Créneaux disponibles:", timeSlots);

  return (
    <div className="container mx-auto px-4 py-8">
      <Button
        variant="outline"
        size="sm"
        onClick={() => navigate("/spaces")}
        className="flex items-center gap-2 mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour aux espaces
      </Button>

      <h1 className="text-2xl font-bold mb-6">Réservation d'espace</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          {space && space.pricing_type !== 'hourly' ? (
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Sélectionnez votre date</h3>
                <Calendar
                  mode="single"
                  selected={selectedDays[0]}
                  onSelect={date => setSelectedDays(date ? [date] : [])}
                  className="rounded-md border"
                />
              </CardContent>
            </Card>
          ) : (
            <DateRangeSelector
              selectedDays={selectedDays}
              onDaysChange={setSelectedDays}
            />
          )}
          
          <TimeSlotSelector
            timeSlots={timeSlots}
            selectedSlot={selectedSlot || undefined}
            onSlotSelect={handleSlotSelect}
            space={space}
          />
        </div>
        
        <div>
          {mappedSpace && (
            <BookingSummary
              space={mappedSpace}
              selectedDays={selectedDays}
              selectedTimeSlot={selectedSlot || undefined}
              isRecurring={false}
              dateRange={selectedDateRange ? {
                from: selectedDateRange.from || new Date(),
                to: selectedDateRange.to || new Date()
              } : undefined}
              termsAccepted={termsAccepted}
              onTermsChange={setTermsAccepted}
              onSubmit={handleSubmit}
            />
          )}
        </div>
      </div>
    </div>
  );
}
