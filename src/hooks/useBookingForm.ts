import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useSpaces } from "./useSpaces";
import { useTimeSlotsAPI } from "./useTimeSlotsAPI";
import { getTimeSlotTimes, getSpacePrice, getPricingLabel } from "@/utils/bookingUtils";
import { useStripePayment } from "@/hooks/useStripePayment";
import { DateRange } from "react-day-picker";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { TimeSlotOption } from "@/types/timeSlots";
import type { Space } from "@/components/admin/types";

// Types simplifiés pour PostgreSQL
interface BookingInsert {
  space_id: string;
  start_time: string;
  end_time: string;
  status?: 'pending' | 'confirmed' | 'cancelled';
  total_price_ht?: number;
  total_price_ttc?: number;
}

interface BookingUpdate {
  status?: 'pending' | 'confirmed' | 'cancelled';
  total_price_ht?: number;
  total_price_ttc?: number;
}

interface SpaceRow {
  id: string;
  name: string;
  description?: string;
  price_per_hour?: number;
  price_per_day?: number;
  price_per_week?: number;
  price_per_month?: number;
  capacity?: number;
  amenities?: string[];
  image_url?: string;
  is_active?: boolean;
}

const bookingSchema = z.object({
  space_id: z.string().min(1, "Espace requis"),
  start_time: z.string().min(1, "Début requis"),
  end_time: z.string().min(1, "Fin requise"),
  status: z.enum(["pending", "confirmed", "cancelled"]).optional(),
  total_price_ht: z.number().min(0).optional(),
  total_price_ttc: z.number().min(0).optional(),
  timeSlot: z.string().optional(),
});

type BookingFormValues = z.infer<typeof bookingSchema>;

export function useBookingForm(spaceId?: string) {
  const { space, spaces, loading } = useSpaces(spaceId);
  const [selectedSpace, setSelectedSpace] = useState<Space | null>(null);
  const [spaceType, setSpaceType] = useState<string>("");

  const handleSpaceSelect = useCallback((space: Space) => {
    setSelectedSpace(space);
    setSpaceType(space.id);
  }, []);

  const handleSpaceChange = useCallback((space: Space) => {
    setSelectedSpace(space);
    setSpaceType(space.id);
  }, []);

  const [loadingForm, setLoadingForm] = useState(false);
  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      space_id: space?.id || "",
      start_time: "",
      end_time: "",
      status: "pending",
      total_price_ht: 0,
      total_price_ttc: 0,
      timeSlot: "",
    },
  });

  const [date, setDate] = useState<Date | undefined>(new Date());
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(),
    to: undefined
  });
  const [selectedDays, setSelectedDays] = useState<string[]>(["monday", "tuesday", "wednesday", "thursday", "friday"]);
  const [isRecurring, setIsRecurring] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const navigate = useNavigate();
  const { createPaymentSession } = useStripePayment();
  
  const { timeSlots } = useTimeSlotsAPI(spaceType);
  const [timeSlot, setTimeSlot] = useState<string>("");
  
  console.log('🔍 useBookingForm:', { 
    spaceType,
    selectedSpaceId: selectedSpace?.id, 
    timeSlotsLength: timeSlots.length,
    timeSlots 
  });

  // Réinitialiser les sélections quand l'espace change
  useEffect(() => {
    if (space) {
      setDate(undefined);
      setDateRange({
        from: new Date(),
        to: undefined
      });
      setTimeSlot("");
      setIsRecurring(false);
      setSelectedDays(["monday", "tuesday", "wednesday", "thursday", "friday"]);
      setTermsAccepted(false);
    }
  }, [space]);

  const createBooking = async (booking: BookingInsert) => {
    try {
      const response = await apiClient.post('/bookings', booking);
      
      if (!response.success) {
        throw new Error(response.error || 'Erreur lors de la création de la réservation');
      }

      return response.data;
    } catch (error) {
      console.error('Erreur création réservation:', error);
      throw error;
    }
  };

  const updateBookingStatus = async (bookingId: string, status: "pending" | "confirmed" | "cancelled") => {
    try {
      const update: BookingUpdate = {
        status,
        updated_at: new Date().toISOString()
      };

      const response = await apiClient.put(`/bookings/${bookingId}`, {
        status
      });

      if (!response.success) {
        throw new Error(response.error || 'Erreur lors de la mise à jour du statut');
      }
    } catch (error) {
      console.error('Erreur mise à jour statut:', error);
      throw error;
    }
  };

  const checkSpaceAvailability = async (spaceId: string, startTime: string, endTime: string) => {
    try {
      const { data: space, error: spaceError } = await supabase
        .from('spaces')
        .select('*')
        .eq('id', spaceId as Database['public']['Tables']['spaces']['Row']['id'])
        .single();

      if (spaceError) throw spaceError;
      if (!space || !isValidSpace(space)) {
        throw new Error("Espace non trouvé");
      }

      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .eq('space_id', spaceId as Database['public']['Tables']['bookings']['Row']['space_id'])
        .eq('status', 'confirmed' as Database['public']['Tables']['bookings']['Row']['status']);

      if (bookingsError) throw bookingsError;

      const overlappingBookings = bookings?.filter(booking => 
        isValidBooking(booking) &&
        booking.start_time < endTime && 
        booking.end_time > startTime
      ) || [];

      return {
        isAvailable: overlappingBookings.length === 0,
        space: space as SpaceRow
      };
    } catch (error) {
      console.error('Erreur vérification disponibilité:', error);
      throw error;
    }
  };

  const onSubmit = async (values: BookingFormValues) => {
    setLoadingForm(true);
    try {
      const bookingData = {
        ...values,
        status: values.status || "pending",
      };
      const { error } = await supabase.from("bookings").upsert(bookingData);
      if (error) throw error;
      toast.success("Réservation sauvegardée");
    } catch (error) {
      toast.error("Erreur lors de la sauvegarde de la réservation");
      console.error(error);
    } finally {
      setLoadingForm(false);
    }
  };

  const getSelectedTimeSlot = (timeSlots: TimeSlotOption[], timeSlot: string | undefined): TimeSlotOption | undefined => {
    return timeSlots.find(slot => slot.value === timeSlot);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSpace || !timeSlot) {
      toast.error("Veuillez sélectionner un espace et un créneau horaire");
      return;
    }

    if (!termsAccepted) {
      toast.error("Veuillez accepter les conditions générales");
      return;
    }

    setIsSubmitting(true);
    try {
      // Validation du créneau horaire
      let selectedTimeSlot: TimeSlotOption | undefined;
      if (timeSlot.startsWith('custom-')) {
        const hours = parseInt(timeSlot.split('-')[1]);
        selectedTimeSlot = {
          id: `custom-${hours}`,
          value: timeSlot,
          label: `${hours} heure${hours > 1 ? 's' : ''}`,
          duration: hours,
          price: 0,
          start_time: '00:00',
          end_time: '23:59',
          is_available: true,
          space_id: '',
          display_order: 0
        };
      } else {
        selectedTimeSlot = getSelectedTimeSlot(timeSlots, timeSlot);
      }

      if (!selectedTimeSlot) {
        throw new Error("Créneau horaire invalide");
      }

      // Vérification de l'authentification
      const { data: { user }, error: userError } = await withRetry(async () => {
        return await supabase.auth.getUser();
      });
      
      if (userError || !user) {
        throw new Error("Vous devez être connecté pour effectuer une réservation");
      }

      // Récupération et validation de l'espace
      const selectedSpace = space as Space;
      if (!selectedSpace) {
        throw new Error("Espace non trouvé ou invalide");
      }

      if (isRecurring && dateRange?.from && dateRange?.to) {
        // Créer des réservations récurrentes
        const bookings = [];
        const currentDate = new Date(dateRange.from);
        const endDate = new Date(dateRange.to);
        
        // Mapper les jours de la semaine aux numéros (0 = dimanche, 1 = lundi, etc.)
        const dayMap: Record<string, number> = {
          sunday: 0, monday: 1, tuesday: 2, wednesday: 3, 
          thursday: 4, friday: 5, saturday: 6
        };
        
        // Créer une réservation pour chaque jour sélectionné dans la plage de dates
        while (currentDate <= endDate) {
          const dayOfWeek = currentDate.getDay();
          const dayName = Object.keys(dayMap).find(key => dayMap[key] === dayOfWeek);
          
          if (dayName && selectedDays.includes(dayName)) {
            const { startTime, endTime } = getTimeSlotTimes(new Date(currentDate), selectedTimeSlot.label);
            
            const isAvailable = await checkSpaceAvailability(selectedSpace.id, startTime.toISOString(), endTime.toISOString());
            if (!isAvailable.isAvailable) {
              // Ignorer les jours non disponibles
              currentDate.setDate(currentDate.getDate() + 1);
              continue;
            }
            
            bookings.push({
              user_id: user.id,
              space_id: selectedSpace.id,
              start_time: startTime.toISOString(),
              end_time: endTime.toISOString(),
              total_price_ht: getSpacePrice(selectedSpace, selectedTimeSlot.duration).ht,
              total_price_ttc: getSpacePrice(selectedSpace, selectedTimeSlot.duration).ttc,
              status: 'confirmed'
            });
          }
          
          // Passer au jour suivant
          currentDate.setDate(currentDate.getDate() + 1);
        }
        
        if (bookings.length === 0) {
          throw new Error("Aucun créneau disponible pour la période sélectionnée");
        }
        
        // Insérer toutes les réservations avec statut "pending"
        const pendingBookings: BookingInsert[] = bookings.map(booking => ({
          user_id: booking.user_id,
          space_id: booking.space_id,
          start_time: booking.start_time,
          end_time: booking.end_time,
          total_price_ht: booking.total_price_ht,
          total_price_ttc: booking.total_price_ttc,
          status: 'pending'
        }));
        
        const insertedBookings = await Promise.all(pendingBookings.map(createBooking));
        
        toast.success(`${insertedBookings.length} réservations créées avec succès !`);
      } else {
        // Réservation simple
        const { startTime, endTime } = getTimeSlotTimes(date!, selectedTimeSlot.label);
        
        const isAvailable = await checkSpaceAvailability(selectedSpace.id, startTime.toISOString(), endTime.toISOString());
        if (!isAvailable.isAvailable) {
          toast.error("Cet espace n'est pas disponible pour la période sélectionnée");
          setIsSubmitting(false);
          return;
        }

        // Calculer le prix
        const price = getSpacePrice(selectedSpace, selectedTimeSlot.duration);

        // Créer la réservation avec statut "pending"
        const bookingInsert: BookingInsert = {
          user_id: user.id,
          space_id: selectedSpace.id,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          total_price_ht: price.ht,
          total_price_ttc: price.ttc,
          status: 'pending'
        };
        const bookingData = await createBooking(bookingInsert);
        
        // Utiliser directement l'email de l'utilisateur authentifié
        const userEmail = user.email || 'client@example.com';
        
        try {
          // Créer une session de paiement Stripe et obtenir l'URL de redirection
          const { url, mode } = await createPaymentSession(
            bookingData.id,
            Math.round(price.ttc * 100), // Convertir en centimes
            userEmail,
            {
              booking_id: bookingData.id,
              space_name: selectedSpace.name || 'Espace',
              start_time: startTime.toISOString(),
              end_time: endTime.toISOString()
            }
          );
          
          // Rediriger l'utilisateur vers la page de paiement Stripe
          toast.info("Redirection vers la page de paiement...");
          window.location.href = url;
          return; // Arrêter l'exécution ici pour éviter la redirection vers le dashboard
        } catch (error) {
          console.error("Erreur lors de la création de la session de paiement:", error);
          toast.error("Impossible de créer la session de paiement. Veuillez réessayer.");
          
          // En cas d'erreur, mettre à jour le statut de la réservation à "cancelled"
          try {
            await updateBookingStatus(bookingData.id, 'cancelled');
          } catch (updateError) {
            console.warn("Erreur lors de l'annulation de la réservation:", updateError);
            // Continuer même en cas d'erreur
          }
          
          setIsSubmitting(false);
          return;
        }
      }

      // Ce code ne sera exécuté que pour les réservations récurrentes
      // car pour les réservations simples, nous redirigeons vers Stripe
      
      setTimeout(() => {
        navigate("/dashboard");
      }, 1500);
    } catch (error) {
      console.error("Error creating booking:", error);
      toast.error(error instanceof Error ? error.message : "Erreur lors de la réservation");
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    form,
    loadingForm,
    isSubmitting,
    termsAccepted,
    setTermsAccepted,
    date,
    setDate,
    dateRange,
    setDateRange,
    selectedDays,
    setSelectedDays,
    isRecurring,
    setIsRecurring,
    timeSlots,
    timeSlot,
    setTimeSlot,
    selectedSpace,
    setSelectedSpace,
    handleSpaceSelect,
    handleSpaceChange,
    handleSubmit,
    onSubmit,
    getSelectedTimeSlot,
    spaceType,
    setSpaceType,
    spaces,
    loading,
    getSpacePrice,
    getPricingLabel
  };
}
