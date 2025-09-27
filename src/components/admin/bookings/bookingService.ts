import { supabase } from "@/integrations/supabase/client";
import type { Booking } from "./types";
import { toast } from "sonner";

export async function fetchBookings(): Promise<Booking[]> {
  try {
    console.log("🔍 Début de la récupération des réservations...");
    
    // Get bookings with space details
    const { data: bookingsData, error: bookingsError } = await supabase
      .from('bookings')
      .select(`
        *,
        spaces:space_id (
          name,
          pricing_type
        )
      `)
      .order('created_at', { ascending: false });
    
    if (bookingsError) {
      console.error("❌ Erreur lors de la récupération des réservations:", bookingsError);
      throw bookingsError;
    }

    console.log(`📊 Réservations récupérées depuis la base: ${bookingsData?.length || 0}`);
    if (bookingsData && bookingsData.length > 0) {
      console.log("📋 Exemple de réservation brute:", bookingsData[0]);
    }

    // Fetch profiles
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name');

    if (profilesError) {
      console.error("❌ Erreur lors de la récupération des profils:", profilesError);
    } else {
      console.log(`👥 Profils récupérés: ${profilesData?.length || 0}`);
    }

    // Map profiles by id for easier lookup
    const profilesMap = new Map(
      (profilesData || []).map(profile => [profile.id, profile])
    );
    
    const bookings = (bookingsData || []).map((booking) => {
      const profile = profilesMap.get(booking.user_id);
      const formattedBooking = {
        id: booking.id,
        user_id: booking.user_id,
        space_id: booking.space_id,
        start_time: booking.start_time,
        end_time: booking.end_time,
        total_price_ht: Number(booking.total_price_ht || 0),
        total_price_ttc: Number(booking.total_price_ttc || 0),
        status: booking.status,
        created_at: booking.created_at,
        updated_at: booking.updated_at,
        user_name: profile?.first_name && profile?.last_name
          ? `${profile.first_name} ${profile.last_name}`
          : `Utilisateur #${booking.user_id.slice(0, 8)}`,
        space_name: booking.spaces?.name || "Espace inconnu",
        space_pricing_type: booking.spaces?.pricing_type || "hourly"
      };
      
      console.log(`📝 Réservation formatée: ${formattedBooking.id} - ${formattedBooking.user_name} - ${formattedBooking.space_name}`);
      return formattedBooking;
    });
    
    console.log(`✅ Récupération terminée: ${bookings.length} réservations formatées`);
    return bookings;
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des réservations:", error);
    toast.error("Impossible de récupérer les réservations");
    return [];
  }
}

export async function updateBookingStatus(id: string, newStatus: string): Promise<boolean> {
  try {
    console.log(`🔄 Mise à jour du statut de la réservation ${id} vers ${newStatus}`);
    
    const { error } = await supabase
      .from("bookings")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", id);
      
    if (error) {
      console.error("❌ Erreur lors de la mise à jour:", error);
      throw error;
    }
    
    console.log(`✅ Statut mis à jour avec succès pour la réservation ${id}`);
    return true;
  } catch (error) {
    console.error("❌ Erreur lors de la mise à jour du statut:", error);
    toast.error("Impossible de mettre à jour la réservation");
    return false;
  }
}

export async function fetchUserBookings(userId: string): Promise<Booking[]> {
  try {
    console.log(`🔍 Récupération des réservations pour l'utilisateur ${userId}`);
    const allBookings = await fetchBookings();
    const userBookings = allBookings.filter(b => b.user_id === userId);
    console.log(`✅ ${userBookings.length} réservations trouvées pour l'utilisateur ${userId}`);
    return userBookings;
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des réservations utilisateur:", error);
    toast.error("Impossible de récupérer vos réservations");
    return [];
  }
}

export async function deleteBooking(id: string): Promise<boolean> {
  try {
    console.log(`🗑️ Suppression de la réservation ${id}`);
    
    const { error } = await supabase
      .from("bookings")
      .delete()
      .eq("id", id);
      
    if (error) {
      console.error("❌ Erreur lors de la suppression:", error);
      throw error;
    }
    
    console.log(`✅ Réservation ${id} supprimée avec succès`);
    toast.success("Réservation supprimée avec succès");
    return true;
  } catch (error) {
    console.error("❌ Erreur lors de la suppression de la réservation:", error);
    toast.error("Impossible de supprimer la réservation");
    return false;
  }
}
