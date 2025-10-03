import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContextPostgreSQL";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminNavigation } from "@/components/admin/AdminNavigation";
import { CookieSettingsAdmin } from "@/components/admin/CookieSettings";
import { SidebarContent } from "@/components/ui/sidebar";
import AdminOverview from "@/components/admin/AdminOverview";
import AdminOverviewDual from "@/components/admin/AdminOverviewDual";
import AdminUsers from "@/components/admin/AdminUsers";
import AdminSpaces from "@/components/admin/AdminSpaces";
import AdminBookings from "@/components/admin/AdminBookings";
import AdminPayments from "@/components/admin/AdminPayments";
import AdminSettings from "@/components/admin/AdminSettings";
import TimeSlots from "@/components/admin/TimeSlots";
import AdminEmails from "@/components/admin/AdminEmails";
import AdminDatabase from "@/components/admin/AdminDatabase";
import PaymentConfig from "@/components/admin/PaymentConfig";
import AdminLegalPages from "@/components/admin/AdminLegalPages";
import AdminSupport from "@/pages/admin/AdminSupport";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdminStats } from "@/hooks/useAdminStats";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  AlertCircle, 
  Users, 
  Building2, 
  Calendar, 
  Euro, 
  Box,
  Home,
  Settings,
  Coins,
  Clock,
  Mail,
  Database,
  CreditCard,
  FileText,
  Cookie,
  LifeBuoy
} from "lucide-react";
import { RecentBookings } from "@/components/admin/dashboard/RecentBookings";

const AdminDashboard = () => {
  const [activeView, setActiveView] = useState("overview");
  const { user, loading, isAdmin } = useAuth();

  const getViewTitle = () => {
    switch (activeView) {
      case "overview": return "Tableau de bord";
      case "overview-dual": return "Vue Dual (Test/Production)";
      case "spaces": return "Gestion des espaces";
      case "users": return "Gestion des utilisateurs";
      case "bookings": return "Gestion des réservations";
      case "payments": return "Gestion des paiements";
      case "payment-config": return "Configuration des paiements";
      case "timeslots": return "Gestion des créneaux horaires";
      case "emails": return "Gestion des emails";
      case "database": return "Gestion de la base de données";
      case "legal-pages": return "Pages légales";
      case "cookie-settings": return "Paramètres des cookies";
      case "settings": return "Paramètres";
      case "support": return "Support";
      default: return "Tableau de bord";
    }
  };

  const renderContent = () => {
    switch (activeView) {
      case "overview":
        return <AdminOverview />;
      case "overview-dual":
        return <AdminOverviewDual />;
      case "spaces":
        return <AdminSpaces />;
      case "users":
        return <AdminUsers />;
      case "bookings":
        return <AdminBookings />;
      case "payments":
        return <AdminPayments />;
      case "timeslots":
        return <TimeSlots />;
      case "emails":
        return <AdminEmails />;
      case "database":
        return <AdminDatabase />;
      case "payment-config":
        return <PaymentConfig />;
      case "legal-pages":
        return <AdminLegalPages />;
      case "cookie-settings":
        return <CookieSettingsAdmin />;
      case "settings":
        return <AdminSettings />;
      case "support":
        return <AdminSupport />;
      default:
        return <AdminOverview />;
    }
  };

  // Si l'authentification est en cours de chargement, afficher un spinner
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de l'interface d'administration...</p>
        </div>
      </div>
    );
  }

  // Si l'utilisateur n'est pas connecté ou n'est pas admin, le AdminLayout s'en chargera
  if (!user || !isAdmin) {
    return null;
  }

  return (
    <AdminLayout title={getViewTitle()}>
      <div className="space-y-6">
        {/* Navigation */}
        <AdminNavigation activeView={activeView} onViewChange={setActiveView} />

        {/* Contenu */}
        <div className="mt-6">
          {renderContent()}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
