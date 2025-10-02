import { useState, useEffect, useCallback, useRef } from "react";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/context/AuthContextPostgreSQL";

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
      
      // Récupérer l'utilisateur connecté via l'API
      const userResponse = await apiClient.getCurrentUser();
      
      if (!userResponse.success || !userResponse.data) {
        globalState.bookings = [];
        globalState.loading = false;
        notifySubscribers();
        return;
      }
      
      const user = userResponse.data;

      // Si l'utilisateur a changé, nettoyer l'ancien état
      if (globalState.userId !== user.id) {
        globalState.userId = user.id;
      }
      
      // Récupérer les réservations via l'API
      const bookingsResponse = await apiClient.get('/bookings');
      
      if (!bookingsResponse.success) {
        throw new Error(bookingsResponse.error || 'Erreur lors du chargement des réservations');
      }

      // S'assurer que les données sont un tableau
      const bookingsData = Array.isArray(bookingsResponse.data) ? bookingsResponse.data : [];
      
      if (bookingsData.length === 0) {
        globalState.bookings = [];
      } else {
        globalState.bookings = bookingsData;
      }

      globalState.loading = false;
      notifySubscribers();

      // Temps réel désactivé - utilisation de PostgreSQL sans Supabase
      // Les mises à jour se feront via rechargement manuel
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