import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

// État global pour éviter les souscriptions multiples
let globalState = {
  bookings: [] as any[],
  loading: true,
  error: null as string | null,
  channel: null as any,
  userId: null as string | null,
  subscribers: new Set<(bookings: any[], loading: boolean, error: string | null) => void>()
};

const notifySubscribers = () => {
  globalState.subscribers.forEach(callback => 
    callback(globalState.bookings, globalState.loading, globalState.error)
  );
};

interface Booking {
  id: string;
  space_id: string;
  user_id: string;
  start_time: string;
  end_time: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  total_price_ht: number;
  total_price_ttc: number;
  created_at: string;
  updated_at: string;
  spaces?: {
    id: string;
    name: string;
    description: string | null;
    capacity: number;
    hourly_price: number;
    daily_price: number;
    monthly_price: number;
    yearly_price: number;
    half_day_price: number;
    quarter_price: number;
    custom_price: number;
    custom_label: string;
    image_url: string;
    pricing_type: string;
  };
}

export function useUserBookings() {
  const [bookings, setBookings] = useState<Booking[]>(globalState.bookings);
  const [loading, setLoading] = useState(globalState.loading);
  const [error, setError] = useState<string | null>(globalState.error);

  const loadUserBookings = useCallback(async () => {
    try {
      globalState.loading = true;
      globalState.error = null;
      notifySubscribers();
      
      // Récupérer l'utilisateur connecté
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        globalState.bookings = [];
        globalState.loading = false;
        notifySubscribers();
        return;
      }

      // Si l'utilisateur a changé, nettoyer l'ancien canal
      if (globalState.userId !== user.id) {
        if (globalState.channel) {
          supabase.removeChannel(globalState.channel);
          globalState.channel = null;
        }
        globalState.userId = user.id;
      }
      
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          spaces (
            id,
            name,
            description,
            capacity,
            hourly_price,
            daily_price,
            monthly_price,
            yearly_price,
            half_day_price,
            quarter_price,
            custom_price,
            custom_label,
            image_url,
            pricing_type
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!data || data.length === 0) {
        globalState.bookings = [];
      } else {
        globalState.bookings = data;
      }

      globalState.loading = false;
      notifySubscribers();

      // Configurer le canal temps réel si pas déjà fait
      if (!globalState.channel) {
        globalState.channel = supabase
          .channel('user_bookings_changes')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'bookings'
            },
                        (payload) => {
              // Vérifier que la réservation appartient à l'utilisateur actuel
              if (payload.eventType === 'DELETE') {
                // Pour les suppressions, vérifier si la réservation existe dans notre état local
                const bookingExists = globalState.bookings.some(booking => booking.id === payload.old?.id);
                
                if (!bookingExists) {
                  return;
                }
              } else {
                // Pour INSERT/UPDATE, vérifier le user_id
                const bookingUserId = payload.new?.user_id;
                
                if (bookingUserId !== user.id) {
                  return;
                }
              }
              
              if (payload.eventType === 'DELETE') {
                // Suppression : retirer de l'état global
                globalState.bookings = globalState.bookings.filter(booking => booking.id !== payload.old.id);
                notifySubscribers();
              } else if (payload.eventType === 'INSERT') {
                // Nouvelle réservation : ajouter à l'état global
                globalState.bookings = [payload.new as Booking, ...globalState.bookings];
                notifySubscribers();
              } else if (payload.eventType === 'UPDATE') {
                // Mise à jour : remplacer dans l'état global
                globalState.bookings = globalState.bookings.map(booking => 
                  booking.id === payload.new.id ? payload.new as Booking : booking
                );
                notifySubscribers();
              }
            }
          )
          .subscribe();
      }
    } catch (error) {
      console.error("❌ Erreur lors du chargement des réservations utilisateur:", error);
      globalState.error = "Erreur lors du chargement des réservations";
      globalState.loading = false;
      notifySubscribers();
    }
  }, []);

  useEffect(() => {
    // S'abonner aux changements globaux
    const subscriber = (newBookings: any[], newLoading: boolean, newError: string | null) => {
      setBookings(newBookings);
      setLoading(newLoading);
      setError(newError);
    };
    
    globalState.subscribers.add(subscriber);
    
    // Charger les données si pas encore fait
    if (globalState.bookings.length === 0 && globalState.loading) {
      loadUserBookings();
    } else {
      // Synchroniser avec l'état global actuel
      setBookings(globalState.bookings);
      setLoading(globalState.loading);
      setError(globalState.error);
    }

    return () => {
      globalState.subscribers.delete(subscriber);
    };
  }, [loadUserBookings]);

  return { 
    bookings, 
    loading, 
    error, 
    refetch: loadUserBookings 
  };
} 