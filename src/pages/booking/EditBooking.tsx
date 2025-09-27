import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { DateSelector } from "@/components/booking/DateSelector";
import { SpaceSelector } from "@/components/booking/SpaceSelector";
import { BookingSummary } from "@/components/booking/BookingSummary";
import { useBookingForm } from "@/hooks/useBookingForm";
import { getTimeSlotTimes } from "@/utils/bookingUtils";
import type { Booking, Space, TimeSlotOption } from "@/types/booking";

const EditBooking = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<Booking | null>(null);

  const {
    date,
    setDate,
    spaceType,
    setSpaceType,
    timeSlot,
    setTimeSlot,
    spaces,
    timeSlots,
    getSpacePrice,
    getPricingLabel,
    isSubmitting,
    loading: formLoading,
    termsAccepted,
    setTermsAccepted
  } = useBookingForm();

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        if (!id) return;

        const { data: bookingData, error: bookingError } = await supabase
          .from("bookings")
          .select(`
            *,
            spaces (*)
          `)
          .eq("id", id)
          .single();

        if (bookingError) throw bookingError;
        if (!bookingData) {
          toast.error("Réservation non trouvée");
          navigate("/dashboard");
          return;
        }

        setBooking(bookingData);
        setSpaceType(bookingData.space_id);
        setDate(new Date(bookingData.start_time));
        
        // Find matching time slot
        const startTime = new Date(bookingData.start_time);
        const endTime = new Date(bookingData.end_time);
        const matchingSlot = timeSlots.find(slot => {
          const slotStart = startTime.getHours().toString().padStart(2, '0') + ':' + startTime.getMinutes().toString().padStart(2, '0');
          const slotEnd = endTime.getHours().toString().padStart(2, '0') + ':' + endTime.getMinutes().toString().padStart(2, '0');
          return slot.label === `${slotStart} - ${slotEnd}`;
        });
        
        if (matchingSlot) {
          setTimeSlot(matchingSlot.id);
        }
      } catch (error) {
        console.error("Error fetching booking:", error);
        toast.error("Erreur lors du chargement de la réservation");
        navigate("/dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [id, navigate, setDate, setSpaceType, setTimeSlot, timeSlots]);

  const handleSubmit = async () => {
    try {
      if (!booking || !spaceType || !date || !timeSlot) {
        toast.error("Veuillez remplir tous les champs");
        return;
      }

      const selectedSpace = spaces.find(space => space.id === spaceType);
      if (!selectedSpace) {
        toast.error("Espace non trouvé");
        return;
      }

      const selectedTimeSlotObj = timeSlots.find(slot => slot.id === timeSlot);
      if (!selectedTimeSlotObj) {
        toast.error("Créneau horaire non trouvé");
        return;
      }

      const { startTime, endTime } = getTimeSlotTimes(date, selectedTimeSlotObj.label);
      const prices = getSpacePrice(selectedSpace);

      const { error } = await supabase
        .from("bookings")
        .update({
          space_id: selectedSpace.id,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          total_price_ht: prices.ht,
          total_price_ttc: prices.ttc,
          updated_at: new Date().toISOString(),
        })
        .eq("id", booking.id);

      if (error) throw error;

      toast.success("Réservation modifiée avec succès");
      navigate("/dashboard");
    } catch (error) {
      console.error("Error updating booking:", error);
      toast.error("Erreur lors de la modification de la réservation");
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour au tableau de bord
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Chargement...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const selectedSpace = spaces.find(space => space.id === spaceType);
  const prices = getSpacePrice(selectedSpace);
  const selectedTimeSlotObj = timeSlots.find(slot => slot.id === timeSlot);

  const selectedSpaceForSummary: Space | undefined = selectedSpace
    ? {
        ...selectedSpace,
        price: prices.ttc,
        description: selectedSpace.description ?? '',
        image_url: selectedSpace.image_url ?? '',
        is_available: selectedSpace.is_active ?? true,
      }
    : undefined;

  const selectedTimeSlotForSummary: TimeSlotOption | undefined = selectedTimeSlotObj && date
    ? {
        id: selectedTimeSlotObj.id,
        label: selectedTimeSlotObj.label,
        startTime: getTimeSlotTimes(date, selectedTimeSlotObj.label).startTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        endTime: getTimeSlotTimes(date, selectedTimeSlotObj.label).endTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        price: prices.ttc,
        isAvailable: selectedTimeSlotObj.is_available ?? true
      }
    : undefined;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour au tableau de bord
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Modifier la réservation</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-6">
            <SpaceSelector
              spaces={spaces}
              selected={spaceType}
              onSelect={setSpaceType}
              loading={formLoading}
              getSpacePrice={getSpacePrice}
              getPricingLabel={getPricingLabel}
            />
            
            {spaceType && (
              <DateSelector
                selected={date}
                onSelect={setDate}
                timeSlots={timeSlots}
                selectedSlot={timeSlot}
                onSlotSelect={setTimeSlot}
              />
            )}

            {selectedSpaceForSummary && (
              <BookingSummary
                space={selectedSpaceForSummary}
                selectedDays={[date || new Date()]}
                selectedTimeSlot={selectedTimeSlotForSummary}
                isRecurring={false}
                dateRange={date ? { from: date, to: date } : undefined}
                termsAccepted={termsAccepted}
                onTermsChange={setTermsAccepted}
                onSubmit={handleSubmit}
              />
            )}

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/dashboard")}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !spaceType || !date || !timeSlot}
              >
                Modifier la réservation
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditBooking;
