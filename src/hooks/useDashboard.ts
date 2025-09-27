import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContextNew";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

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
  const { user, profile, isAdmin: contextIsAdmin, loading: authLoading, profileLoaded } = useAuth();
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
      
      // Récupérer les réservations
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select(`*, spaces:space_id (name, pricing_type)`)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
      if (bookingsError) {
        toast.error("Erreur lors du chargement des réservations");
        setLoading(false);
        return;
      }
      
      // Filtrer les réservations à venir (date de fin > maintenant)
      const now = new Date();
      const upcomingBookings = bookings?.filter(b => new Date(b.end_time) > now) || [];
      
      setStats({
        totalBookings: bookings?.length || 0,
        upcomingBookings: upcomingBookings.length,
        recentActivities: upcomingBookings.slice(0, 5).map(b => ({
          id: b.id,
          description: `${b.spaces?.name || 'Espace'} - ${b.start_time}`,
          date: b.start_time,
          status: b.status,
          total_price_ht: b.total_price_ht || 0,
          total_price_ttc: b.total_price_ttc || 0,
          startTime: b.start_time,
          endTime: b.end_time,
          spaceName: b.spaces?.name || 'Espace',
          pricingType: b.spaces?.pricing_type || 'hourly'
        })) || []
      });
      setLoading(false);
    };
    
    checkAuthAndFetch();
  }, [navigate, user, contextIsAdmin, authLoading, profileLoaded]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Déconnexion réussie");
      navigate("/auth/login");
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