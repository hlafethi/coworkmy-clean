import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContextPostgreSQL";

import { UserHeader } from "@/components/dashboard/UserHeader";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { SpacesCard } from "@/components/dashboard/SpacesCard";
import { AllBookings } from "@/components/dashboard/AllBookings";
import { useDashboard } from "@/hooks/useDashboard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StripeCustomerPortal } from "@/components/common/StripeCustomerPortal";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { loading, stats, userProfile, isAdmin, handleLogout, refreshStats } = useDashboard();

  // Tawk.to a été désactivé

  useEffect(() => {
    // Vérifier si l'utilisateur est connecté
    if (!user) {
      toast.error("Vous devez être connecté pour accéder à cette page");
      navigate("/auth/login");
    }
  }, [user, navigate]);

  // Fonction pour afficher le badge de statut avec la bonne couleur
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed":
        return <Badge className="bg-green-500 hover:bg-green-600">Confirmée</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">En attente</Badge>;
      case "cancelled":
        return <Badge className="bg-red-500 hover:bg-red-600">Annulée</Badge>;
      default:
        return <Badge className="bg-gray-500 hover:bg-gray-600">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="animate-pulse">
          <div className="h-8 w-1/3 bg-gray-200 rounded mb-6"></div>
          <div className="h-64 bg-gray-200 rounded mb-6"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <UserHeader
        firstName={userProfile?.first_name || "Utilisateur"}
        lastName={userProfile?.last_name || ""}
        onLogout={handleLogout}
      />
      <div className="container mx-auto px-4 pt-4 flex justify-end gap-2">
        <StripeCustomerPortal variant="compact" />
        <Button variant="outline" onClick={() => navigate('/support')}>
          🛟 Support
        </Button>
      </div>
      <main className="container mx-auto px-4 py-8">
        <StatsCards
          totalBookings={stats.totalBookings}
          upcomingBookings={stats.upcomingBookings}
        />

        <div className="mt-8">
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Mes réservations</h2>
            <p className="text-gray-600">Gérez toutes vos réservations d'espaces de coworking</p>
          </div>
          <AllBookings onBookingChange={refreshStats} />
        </div>

        <div className="mt-8">
          <SpacesCard />
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
