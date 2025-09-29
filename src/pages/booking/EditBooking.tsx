import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
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

        const response = await apiClient.get(`/bookings/${id}`);
        
        if (!response.success) {
          toast.error("Réservation non trouvée");
          navigate("/dashboard");
          return;
        }

        setBooking(response.data);
        console.log('🔍 Données de réservation:', {
          space_id: response.data.space_id,
          start_date: response.data.start_date,
          end_date: response.data.end_date
        });
        setSpaceType(response.data.space_id);
        setDate(new Date(response.data.start_date));
      } catch (error) {
        console.error("Error fetching booking:", error);
        toast.error("Erreur lors du chargement de la réservation");
        navigate("/dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [id, navigate, setDate, setSpaceType, setTimeSlot]);

  // Effet séparé pour sélectionner le créneau quand timeSlots est disponible
  useEffect(() => {
    console.log('🔍 useEffect timeSlots:', { booking: !!booking, timeSlotsLength: timeSlots.length, timeSlots });
    
    // Si on a des créneaux mais pas de réservation chargée, sélectionner le premier créneau
    if (timeSlots.length > 0 && !booking && !timeSlot) {
      console.log('🔍 Sélection automatique du premier créneau');
      setTimeSlot(timeSlots[0].id);
      return;
    }
    
    if (!booking || timeSlots.length === 0) return;
    
    console.log('🔍 Recherche du créneau correspondant:', {
      start_date: booking.start_date,
      end_date: booking.end_date,
      timeSlotsAvailable: timeSlots.length
    });
    
    const startTime = new Date(booking.start_date);
    const endTime = new Date(booking.end_date);
    
    // Convertir les heures en format local (UTC+1)
    const localStartTime = new Date(startTime.getTime() + (startTime.getTimezoneOffset() * 60000));
    const localEndTime = new Date(endTime.getTime() + (endTime.getTimezoneOffset() * 60000));
    
    const startHour = localStartTime.getHours();
    const endHour = localEndTime.getHours();
    
    console.log('🔍 Heures locales:', { startHour, endHour });
    
    // Chercher un créneau qui correspond à l'heure de début
    const matchingSlot = timeSlots.find(slot => {
      const slotStartHour = parseInt(slot.startTime.split(':')[0]);
      return slotStartHour === startHour;
    });
    
    console.log('🔍 Créneau trouvé:', matchingSlot);
    
    if (matchingSlot) {
      setTimeSlot(matchingSlot.id);
    } else {
      // Si aucun créneau ne correspond, sélectionner le premier créneau disponible
      console.log('⚠️ Aucun créneau correspondant trouvé, sélection du premier créneau');
      if (timeSlots.length > 0) {
        setTimeSlot(timeSlots[0].id);
      }
    }
  }, [booking, timeSlots, setTimeSlot]);

  const handleSubmit = async () => {
    console.log('🔍 handleSubmit appelé:', { booking: !!booking, spaceType, date, timeSlot });
    
    try {
      if (!booking || !spaceType || !date || !timeSlot) {
        console.log('❌ Données manquantes pour la soumission');
        toast.error("Veuillez remplir tous les champs");
        return;
      }

      const selectedSpace = spaces.find(space => space.id === spaceType);
      if (!selectedSpace) {
        console.log('❌ Espace non trouvé');
        toast.error("Espace non trouvé");
        return;
      }

      const selectedTimeSlotObj = timeSlots.find(slot => slot.id === timeSlot);
      if (!selectedTimeSlotObj) {
        console.log('❌ Créneau horaire non trouvé');
        toast.error("Créneau horaire non trouvé");
        return;
      }

      const { startTime, endTime } = getTimeSlotTimes(date, selectedTimeSlotObj.label);
      const prices = getSpacePrice(selectedSpace);

      const updateData = {
        space_id: selectedSpace.id,
        start_date: startTime.toISOString(),
        end_date: endTime.toISOString(),
        total_price: prices.ht,
        status: 'pending'
      };

      console.log('📝 Données de mise à jour:', updateData);

      const response = await apiClient.put(`/bookings/${booking.id}`, updateData);
      console.log('📝 Réponse API:', response);

      if (!response.success) {
        console.log('❌ Erreur dans la réponse API:', response);
        throw new Error(response.error || 'Erreur lors de la mise à jour');
      }

      console.log('✅ Réservation modifiée avec succès, redirection vers /dashboard');
      toast.success("Réservation modifiée avec succès");
      console.log('🚀 Tentative de redirection vers /dashboard...');
      navigate("/dashboard");
      console.log('🚀 Redirection exécutée');
    } catch (error) {
      console.error("❌ Error updating booking:", error);
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
  
  // Log permanent pour déboguer l'état du bouton
  console.log('🔍 État du bouton:', {
    isSubmitting,
    spaceType: !!spaceType,
    date: !!date,
    timeSlot: !!timeSlot,
    disabled: isSubmitting || !spaceType || !date || !timeSlot
  });

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
                type="button"
                disabled={isSubmitting || !spaceType || !date || !timeSlot}
                onClick={() => {
                  console.log('🔍 CLIC SUR LE BOUTON DÉTECTÉ !');
                  console.log('🔍 État des variables:', {
                    isSubmitting,
                    spaceType,
                    date,
                    timeSlot,
                    disabled: isSubmitting || !spaceType || !date || !timeSlot
                  });
                  console.log('🔍 Appel direct de handleSubmit...');
                  handleSubmit();
                }}
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
