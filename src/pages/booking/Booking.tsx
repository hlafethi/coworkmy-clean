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
import { logger } from '@/utils/logger';
import { useToast } from "@/hooks/use-toast";
import { useStripePayment } from "@/hooks/useStripePayment";
import { useAuth } from "@/context/AuthContextPostgreSQL";
import { apiClient } from "@/lib/api-client";

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
  const { toast } = useToast();
  const { createPaymentSession } = useStripePayment();

  logger.log("📍 Page Booking - spaceId:", spaceId);
  logger.log("📍 Location state:", location.state);

  useEffect(() => {
    if (spaceId) {
      if (space) {
        setSelectedDays([space.created_at ? new Date(space.created_at) : new Date()]);
        setSelectedDateRange({ from: space.created_at ? new Date(space.created_at) : new Date(), to: space.created_at ? new Date(space.created_at) : new Date() });
        setSelectedSlot(space.pricing_type === 'hourly' ? space.hourly_price : space.daily_price);
      } else {
        setErrorDetails("Impossible de charger les informations de l'espace. Veuillez réessayer.");
      }
    } else {
      setErrorDetails("ID de l'espace manquant dans l'URL");
    }
  }, [spaceId]);

  logger.log("Loader state:", { loading });

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
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un créneau et une date",
        variant: "destructive",
        duration: 5000,
      });
      return;
    }

    if (!termsAccepted) {
      toast({
        title: "Erreur",
        description: "Veuillez accepter les conditions générales",
        variant: "destructive",
        duration: 5000,
      });
      return;
    }

    try {
      if (!user) {
        toast({
          title: "Erreur",
          description: "Vous devez être connecté pour effectuer une réservation",
          variant: "destructive",
          duration: 5000,
        });
        navigate("/auth/login");
        return;
      }

      const startTime = new Date(selectedDays[0]);
      startTime.setHours(parseInt(selectedSlot.startTime.split(':')[0]));
      startTime.setMinutes(parseInt(selectedSlot.startTime.split(':')[1]));

      const endTime = new Date(selectedDays[0]);
      endTime.setHours(parseInt(selectedSlot.endTime.split(':')[0]));
      endTime.setMinutes(parseInt(selectedSlot.endTime.split(':')[1]));

      // 1. Créer la réservation en pending via l'API
      // Utiliser le prix de l'espace si le slot n'a pas de prix défini
      const slotPrice = selectedSlot.price || space.price_per_hour || 0;
      
      const bookingData = {
        user_id: user.id,
        space_id: space.id,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        status: 'pending',
        total_price_ht: slotPrice,
        total_price_ttc: slotPrice * 1.2, // TVA 20%
        description: `Réservation pour ${space.name}`,
        attendees: 1
      };

      console.log('🔍 Données de réservation envoyées:', JSON.stringify(bookingData, null, 2));
      console.log('🔍 User ID:', user.id);
      console.log('🔍 Space ID:', space.id);
      console.log('🔍 Start Time:', startTime.toISOString());
      console.log('🔍 End Time:', endTime.toISOString());
      console.log('🔍 Selected Slot:', selectedSlot);
      console.log('🔍 Slot Price:', selectedSlot.price);
      console.log('🔍 Space Price:', space.price_per_hour);
      console.log('🔍 Calculated Price:', slotPrice);

      const bookingResponse = await apiClient.post('/bookings', bookingData);

      if (!bookingResponse.success) {
        throw new Error(bookingResponse.error || 'Erreur lors de la création de la réservation');
      }

      const booking = bookingResponse.data;

      // 2. Pour l'instant, créer la réservation sans paiement Stripe
      console.log('✅ Réservation créée avec succès:', booking);
      
      toast({
        title: "Réservation créée !",
        description: `Votre réservation pour ${space.name} a été créée avec succès.`,
        variant: "default"
      });

      // Rediriger vers le dashboard
      navigate('/dashboard');
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la réservation ou du paiement.",
        variant: "destructive",
        duration: 5000,
      });
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

  logger.log("📍 Espace actuel:", currentSpace);
  logger.log("📍 Créneaux disponibles:", timeSlots);

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
