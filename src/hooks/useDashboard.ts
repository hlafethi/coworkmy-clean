import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContextPostgreSQL";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";

interface DashboardStats {
  totalBookings: number;
  upcomingBookings: number;
  recentActivities: Array<{
    id: string;
    description: string;
    date: string;
    status: string;
    total_price_ht: number;
    total_price_ttc: number;
    startTime: string;
    endTime: string;
    spaceName: string;
    pricingType: string;
  }>;
}

export function useDashboard() {
  const navigate = useNavigate();
  const { user, profile, isAdmin: contextIsAdmin, loading: authLoading, profileLoaded, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalBookings: 0,
    upcomingBookings: 0,
    recentActivities: [],
  });

  useEffect(() => {
    const checkAuthAndFetch = async () => {
      // Attendre que l'authentification soit terminée
      if (typeof user === 'undefined' || authLoading) {
        return;
      }
      
      // Si pas d'utilisateur, rediriger
      if (!user) {
        toast.error("Veuillez vous connecter pour accéder à cette page");
        navigate("/auth/login");
        return;
      }
      
      // Si admin, rediriger
      if (contextIsAdmin) {
        navigate("/admin");
        return;
      }
      
      // Si le profil n'est pas encore chargé, attendre
      if (!profileLoaded) {
        return;
      }
      
        // Récupérer les réservations via l'API
        const bookingsResponse = await apiClient.get('/bookings');
          
        if (!bookingsResponse.success) {
          toast.error("Erreur lors du chargement des réservations");
          setLoading(false);
          return;
        }
      
      const bookings = bookingsResponse.data;
      
      // Filtrer les réservations à venir (date de fin > maintenant)
      const now = new Date();
      const upcomingBookings = bookings?.filter(b => {
        const endTime = new Date(b.end_date);
        return endTime > now;
      }) || [];
      
      setStats({
        totalBookings: bookings?.length || 0,
        upcomingBookings: upcomingBookings.length,
        recentActivities: upcomingBookings.slice(0, 5).map(b => ({
          id: b.id,
          description: `${b.space_name || 'Espace'} - ${b.start_date}`,
          date: b.start_date,
          status: b.status,
          total_price_ht: b.total_price || 0,
          total_price_ttc: b.total_price || 0,
          startTime: b.start_date,
          endTime: b.end_date,
          spaceName: b.space_name || 'Espace',
          pricingType: 'hourly'
        })) || []
      });
      setLoading(false);
    };
    
    checkAuthAndFetch();
  }, [navigate, user, contextIsAdmin, authLoading, profileLoaded]);

  const handleLogout = async () => {
    try {
      // Utiliser la fonction signOut du contexte qui gère déjà la redirection
      await signOut();
      toast.success("Déconnexion réussie");
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
      toast.error("Une erreur s'est produite lors de la déconnexion");
    }
  };

  return {
    loading: loading || authLoading || !profileLoaded,
    isAdmin: contextIsAdmin,
    stats,
    userProfile: profile,
    handleLogout,
  };
}