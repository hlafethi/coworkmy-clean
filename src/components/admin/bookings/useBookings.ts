import { useState, useEffect, useRef } from "react";
import { type Booking } from "./types";
import { fetchBookings, updateBookingStatus, deleteBooking } from "./bookingService";
import { toast } from "sonner";
import { logger } from '@/utils/logger';

export function useBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  const loadBookings = async () => {
    if (!isMountedRef.current) return;
    
    try {
      logger.debug("🔄 Chargement des réservations dans useBookings hook...");
      setLoading(true);
      setError(null);
      
      const data = await fetchBookings();
      
      if (!isMountedRef.current) return;
      
      if (data.length === 0) {
        logger.debug("ℹ️ Aucune réservation trouvée");
      } else {
        logger.debug(`✅ Chargement réussi: ${data.length} réservations trouvées`);
        logger.debug("📋 Exemples de réservations:", data.slice(0, 2));
      }
      
      setBookings(data);
    } catch (error: any) {
      if (!isMountedRef.current) return;
      logger.error("❌ Erreur lors du chargement des réservations:", error);
      setError(error?.message || "Une erreur est survenue lors du chargement des réservations");
      toast.error("Impossible de charger les réservations. Veuillez réessayer.");
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    logger.debug("🔌 Initialisation du hook useBookings...");
    
    // Charger les réservations immédiatement
    loadBookings();

    // Cleanup
    return () => {
      logger.debug("🧹 Nettoyage du hook useBookings...");
      isMountedRef.current = false;
    };
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    if (!isMountedRef.current) return;
    
    setRefreshing(true);
    logger.debug(`🔄 Mise à jour du statut de la réservation: ${id} vers ${newStatus}`);
    try {
      const success = await updateBookingStatus(id, newStatus);
      if (success) {
        // Recharger immédiatement les réservations
        await loadBookings();
        toast.success(`Statut de la réservation mis à jour avec succès`);
      } else {
        toast.error("Échec de la mise à jour du statut de la réservation");
        setRefreshing(false);
      }
    } catch (error) {
      logger.error("❌ Erreur lors de la mise à jour du statut:", error);
      toast.error("Erreur lors de la mise à jour du statut");
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    if (!isMountedRef.current) return;
    
    logger.debug("🔄 Actualisation manuelle demandée");
    setRefreshing(true);
    loadBookings();
  };

  const handleDeleteBooking = async (id: string) => {
    if (!isMountedRef.current) return;
    
    setRefreshing(true);
    try {
      const success = await deleteBooking(id);
      if (success) {
        await loadBookings();
      }
    } catch (error) {
      logger.error("❌ Erreur lors de la suppression:", error);
      toast.error("Erreur lors de la suppression de la réservation");
      setRefreshing(false);
    }
  };

  return {
    bookings,
    loading,
    refreshing,
    error,
    handleUpdateStatus,
    handleRefresh,
    handleDeleteBooking,
  };
}
