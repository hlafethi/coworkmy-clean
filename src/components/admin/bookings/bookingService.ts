import { apiClient } from "@/lib/api-client";
import type { Booking } from "./types";
import { toast } from "sonner";
import { logger } from '@/utils/logger';

export async function fetchBookings(): Promise<Booking[]> {
  try {
    logger.debug("🔍 Début de la récupération des réservations admin...");
    
    // Utiliser l'endpoint admin pour récupérer TOUTES les réservations
    const response = await apiClient.get('/admin/bookings');
    
    if (!response.success) {
      logger.error("❌ Erreur lors de la récupération des réservations:", response.error);
      throw new Error(response.error || "Erreur lors de la récupération des réservations");
    }

    const bookingsData = response.data || [];
    logger.debug(`📊 Réservations récupérées depuis l'API admin: ${bookingsData.length}`);
    

    // Vérifier que bookingsData est un tableau
    if (!Array.isArray(bookingsData)) {
      logger.debug('⚠️ bookingsData n\'est pas un tableau, utilisation d\'un tableau vide');
      return [];
    }

    // Mapper les données de l'API vers le format attendu
    const bookings = bookingsData.map((booking: any) => ({
      id: booking.id,
      user_id: booking.user_id,
      space_id: booking.space_id,
      start_time: booking.start_time || booking.start_date,
      end_time: booking.end_time || booking.end_date,
      total_price_ht: booking.total_price_ht || (Number(booking.total_price || 0) / 1.2),
      total_price_ttc: booking.total_price_ttc || Number(booking.total_price || 0),
      status: booking.status,
      created_at: booking.created_at,
      updated_at: booking.updated_at,
      user_name: booking.user_name || booking.display_name || booking.user_email || `Utilisateur #${booking.user_id?.slice(0, 8) || 'Unknown'}`,
      space_name: booking.space_name || "Espace inconnu",
      space_pricing_type: booking.space_pricing_type || "hourly"
    }));
    
    logger.debug(`✅ Récupération terminée: ${bookings.length} réservations formatées`);
    return bookings;
  } catch (error) {
    logger.error("❌ Erreur lors de la récupération des réservations:", error);
    toast.error("Impossible de récupérer les réservations");
    return [];
  }
}

export async function updateBookingStatus(id: string, newStatus: string): Promise<boolean> {
  try {
    logger.debug(`🔄 Mise à jour du statut de la réservation ${id} vers ${newStatus}`);
    
    // Utiliser l'endpoint admin pour la mise à jour du statut
    const response = await apiClient.put(`/admin/bookings/${id}/status`, { status: newStatus });
      
    if (!response.success) {
      logger.error("❌ Erreur lors de la mise à jour:", response.error);
      throw new Error(response.error || "Erreur lors de la mise à jour");
    }
    
    logger.debug(`✅ Statut mis à jour avec succès pour la réservation ${id}`);
    return true;
  } catch (error) {
    logger.error("❌ Erreur lors de la mise à jour du statut:", error);
    toast.error("Impossible de mettre à jour la réservation");
    return false;
  }
}

export async function fetchUserBookings(userId: string): Promise<Booking[]> {
  try {
    logger.debug(`🔍 Récupération des réservations pour l'utilisateur ${userId}`);
    const allBookings = await fetchBookings();
    const userBookings = allBookings.filter(b => b.user_id === userId);
    logger.debug(`✅ ${userBookings.length} réservations trouvées pour l'utilisateur ${userId}`);
    return userBookings;
  } catch (error) {
    logger.error("❌ Erreur lors de la récupération des réservations utilisateur:", error);
    toast.error("Impossible de récupérer vos réservations");
    return [];
  }
}

export async function deleteBooking(id: string): Promise<boolean> {
  try {
    logger.debug(`🗑️ Suppression de la réservation ${id}`);
    
    const response = await apiClient.delete(`/bookings/${id}`);
      
    if (!response.success) {
      logger.error("❌ Erreur lors de la suppression:", response.error);
      throw new Error(response.error || "Erreur lors de la suppression");
    }
    
    logger.debug(`✅ Réservation ${id} supprimée avec succès`);
    toast.success("Réservation supprimée avec succès");
    return true;
  } catch (error) {
    logger.error("❌ Erreur lors de la suppression de la réservation:", error);
    toast.error("Impossible de supprimer la réservation");
    return false;
  }
}
