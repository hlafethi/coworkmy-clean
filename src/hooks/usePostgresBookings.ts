// @ts-nocheck
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { BookingService } from "@/integrations/postgres/services";
import { Booking } from "@/integrations/postgres/types";
import { usePostgresAuth } from "./usePostgresAuth";
// Logger supprimé - utilisation de console directement
/**
 * Hook pour gérer les réservations avec PostgreSQL
 */
export function usePostgresBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [userBookings, setUserBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user, isAdmin } = usePostgresAuth();

  /**
   * Récupérer toutes les réservations
   */
  const fetchAllBookings = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await BookingService.getAll();
      setBookings(data);

      return data;
    } catch (err) {
      console.error("Erreur lors de la récupération des réservations:", err);
      setError(err as Error);
      toast.error("Impossible de charger les réservations");
      return [];
    } finally {
      setLoading(false);
    }
  };

  /**
   * Récupérer les réservations de l'utilisateur connecté
   */
  const fetchUserBookings = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!user?.id) {
        setUserBookings([]);
        return [];
      }

      const data = await BookingService.getByUserId(user.id);
      setUserBookings(data);

      return data;
    } catch (err) {
      console.error("Erreur lors de la récupération des réservations de l'utilisateur:", err);
      setError(err as Error);
      toast.error("Impossible de charger vos réservations");
      return [];
    } finally {
      setLoading(false);
    }
  };

  /**
   * Récupérer les réservations pour un espace
   * @param spaceId ID de l'espace
   */
  const fetchBookingsBySpace = async (spaceId: string) => {
    try {
      setLoading(true);
      setError(null);

      const data = await BookingService.getBySpaceId(spaceId);
      return data;
    } catch (err) {
      console.error("Erreur lors de la récupération des réservations pour l'espace:", err);
      setError(err as Error);
      toast.error("Impossible de charger les réservations pour cet espace");
      return [];
    } finally {
      setLoading(false);
    }
  };

  /**
   * Récupérer les réservations par statut
   * @param status Statut des réservations
   */
  const fetchBookingsByStatus = async (status: string) => {
    try {
      setLoading(true);
      setError(null);

      const data = await BookingService.getByStatus(status);
      return data;
    } catch (err) {
      console.error("Erreur lors de la récupération des réservations par statut:", err);
      setError(err as Error);
      toast.error("Impossible de charger les réservations");
      return [];
    } finally {
      setLoading(false);
    }
  };

  /**
   * Récupérer une réservation par son ID
   * @param id ID de la réservation
   */
  const getBookingById = async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const data = await BookingService.getById(id);
      return data;
    } catch (err) {
      console.error("Erreur lors de la récupération de la réservation:", err);
      setError(err as Error);
      toast.error("Impossible de charger la réservation");
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Créer une nouvelle réservation
   * @param booking Données de la réservation
   */
  const createBooking = async (booking: Omit<Booking, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setLoading(true);
      setError(null);

      // Vérifier la disponibilité de l'espace
      const isAvailable = await BookingService.checkAvailability(
        booking.space_id,
        booking.start_time,
        booking.end_time
      );

      if (!isAvailable) {
        throw new Error("L'espace n'est pas disponible pour cette période");
      }

      const data = await BookingService.create(booking);
      
      // Mettre à jour les listes de réservations
      if (isAdmin) {
        await fetchAllBookings();
      }
      
      if (user?.id === booking.user_id) {
        await fetchUserBookings();
      }
      
      toast.success("Réservation créée avec succès");
      return data;
    } catch (err) {
      console.error("Erreur lors de la création de la réservation:", err);
      setError(err as Error);
      toast.error(err.message || "Impossible de créer la réservation");
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Mettre à jour une réservation
   * @param id ID de la réservation
   * @param booking Données de la réservation
   */
  const updateBooking = async (id: string, booking: Partial<Omit<Booking, 'id' | 'created_at' | 'updated_at'>>) => {
    try {
      setLoading(true);
      setError(null);

      // Si les dates sont modifiées, vérifier la disponibilité
      if (booking.start_time || booking.end_time) {
        const currentBooking = await BookingService.getById(id);
        
        if (!currentBooking) {
          throw new Error("Réservation non trouvée");
        }
        
        const isAvailable = await BookingService.checkAvailability(
          booking.space_id || currentBooking.space_id,
          booking.start_time || currentBooking.start_time,
          booking.end_time || currentBooking.end_time
        );

        if (!isAvailable) {
          throw new Error("L'espace n'est pas disponible pour cette période");
        }
      }

      const data = await BookingService.update(id, booking);
      
      // Mettre à jour les listes de réservations
      if (isAdmin) {
        await fetchAllBookings();
      }
      
      const currentBooking = await BookingService.getById(id);
      if (user?.id === currentBooking?.user_id) {
        await fetchUserBookings();
      }
      
      toast.success("Réservation mise à jour avec succès");
      return data;
    } catch (err) {
      console.error("Erreur lors de la mise à jour de la réservation:", err);
      setError(err as Error);
      toast.error(err.message || "Impossible de mettre à jour la réservation");
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Annuler une réservation
   * @param id ID de la réservation
   */
  const cancelBooking = async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const data = await BookingService.update(id, { status: 'cancelled' });
      
      // Mettre à jour les listes de réservations
      if (isAdmin) {
        await fetchAllBookings();
      }
      
      const currentBooking = await BookingService.getById(id);
      if (user?.id === currentBooking?.user_id) {
        await fetchUserBookings();
      }
      
      toast.success("Réservation annulée avec succès");
      return data;
    } catch (err) {
      console.error("Erreur lors de l'annulation de la réservation:", err);
      setError(err as Error);
      toast.error("Impossible d'annuler la réservation");
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Confirmer une réservation
   * @param id ID de la réservation
   */
  const confirmBooking = async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const data = await BookingService.update(id, { status: 'confirmed' });
      
      // Mettre à jour les listes de réservations
      if (isAdmin) {
        await fetchAllBookings();
      }
      
      const currentBooking = await BookingService.getById(id);
      if (user?.id === currentBooking?.user_id) {
        await fetchUserBookings();
      }
      
      toast.success("Réservation confirmée avec succès");
      return data;
    } catch (err) {
      console.error("Erreur lors de la confirmation de la réservation:", err);
      setError(err as Error);
      toast.error("Impossible de confirmer la réservation");
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Supprimer une réservation
   * @param id ID de la réservation
   */
  const deleteBooking = async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const success = await BookingService.delete(id);
      
      if (success) {
        // Mettre à jour les listes de réservations
        if (isAdmin) {
          await fetchAllBookings();
        }
        
        await fetchUserBookings();
        
        toast.success("Réservation supprimée avec succès");
      } else {
        throw new Error("Impossible de supprimer la réservation");
      }
      
      return success;
    } catch (err) {
      console.error("Erreur lors de la suppression de la réservation:", err);
      setError(err as Error);
      toast.error("Impossible de supprimer la réservation");
      return false;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Vérifier la disponibilité d'un espace pour une période donnée
   * @param spaceId ID de l'espace
   * @param startTime Date de début
   * @param endTime Date de fin
   */
  const checkAvailability = async (spaceId: string, startTime: Date, endTime: Date) => {
    try {
      setLoading(true);
      setError(null);

      const isAvailable = await BookingService.checkAvailability(spaceId, startTime, endTime);
      return isAvailable;
    } catch (err) {
      console.error("Erreur lors de la vérification de la disponibilité:", err);
      setError(err as Error);
      toast.error("Impossible de vérifier la disponibilité");
      return false;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Récupérer les réservations de l'utilisateur avec la fonction RPC
   * @param status Statut des réservations (optionnel)
   * @param limit Nombre de réservations à récupérer (optionnel)
   * @param offset Offset pour la pagination (optionnel)
   */
  const getUserBookingsWithRPC = async (status: string | null = null, limit: number = 10, offset: number = 0) => {
    try {
      setLoading(true);
      setError(null);

      if (!user?.id) {
        return [];
      }

      // Utiliser la fonction RPC get_bookings
      const { query } = await import("@/integrations/postgres/client");
      const result = await query('SELECT * FROM get_bookings($1, $2, $3, $4)', [user.id, status, limit, offset]);
      const data = result.rows;
      
      return data;
    } catch (err) {
      console.error("Erreur lors de la récupération des réservations:", err);
      setError(err as Error);
      toast.error("Impossible de charger les réservations");
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Récupérer les réservations au chargement du composant
  useEffect(() => {
    if (isAdmin) {
      fetchAllBookings();
    }
    
    if (user?.id) {
      fetchUserBookings();
    }
  }, [user, isAdmin]);

  return {
    bookings,
    userBookings,
    loading,
    error,
    isAdmin,
    fetchAllBookings,
    fetchUserBookings,
    fetchBookingsBySpace,
    fetchBookingsByStatus,
    getBookingById,
    createBooking,
    updateBooking,
    cancelBooking,
    confirmBooking,
    deleteBooking,
    checkAvailability,
    getUserBookingsWithRPC
  };
}
