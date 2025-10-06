import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import {
  BookingTable,
  BookingGrid,
  BookingCalendar,
  BookingsHeader,
  useBookings
} from "@/components/admin/bookings";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Grid2X2, List, Calendar } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContextPostgreSQL";
import { createChannel, removeChannel } from "@/lib";
import { logger } from '@/utils/logger';

const AdminBookings = () => {
  const [viewMode, setViewMode] = useState<"grid" | "table" | "calendar">("grid");
  const { user } = useAuth();
  const {
    bookings,
    loading,
    refreshing,
    error,
    handleUpdateStatus,
    handleRefresh,
    handleDeleteBooking
  } = useBookings();

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        if (!user) {
          toast.error("Vous devez être connecté pour accéder à cette page");
        }
      } catch (error) {
        logger.error("Error checking admin access:", error);
      }
    };

    checkAdminAccess();
  }, [user]);

  // WebSocket setup for real-time updates
  useEffect(() => {
    const handleBookingUpdate = (payload: any) => {
      logger.debug('Changement détecté dans les réservations:', payload);
      toast.info("Nouvelle mise à jour des réservations, rafraîchissement...");
      handleRefresh();
    };

    createChannel('admin_bookings_global', 'bookings', handleBookingUpdate);
    createChannel('admin_spaces_global', 'spaces', handleBookingUpdate);

    return () => {
      removeChannel('admin_bookings_global');
      removeChannel('admin_spaces_global');
    };
  }, []); // Dépendances vides pour n'exécuter qu'une fois

  const handleStatusUpdate = async (id: string, status: string) => {
    await handleUpdateStatus(id, status);
  };

  return (
    <div className="space-y-6">
      <BookingsHeader
        refreshing={refreshing}
        onRefresh={handleRefresh}
      />

      <Card>
        <CardHeader>
          <CardTitle>Liste des réservations</CardTitle>
          <CardDescription>Gérez les réservations des utilisateurs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex justify-end">
            <Tabs
              value={viewMode}
              onValueChange={(value) => setViewMode(value as "grid" | "table" | "calendar")}
              className="w-auto"
            >
              <TabsList>
                <TabsTrigger value="grid" className="flex items-center gap-1">
                  <Grid2X2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Grille</span>
                </TabsTrigger>
                <TabsTrigger value="table" className="flex items-center gap-1">
                  <List className="h-4 w-4" />
                  <span className="hidden sm:inline">Tableau</span>
                </TabsTrigger>
                <TabsTrigger value="calendar" className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span className="hidden sm:inline">Calendrier</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          
          {loading ? (
            <p>Chargement des réservations...</p>
          ) : error ? (
            <div className="text-red-500">{error}</div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-10">
              <p>Aucune réservation trouvée</p>
            </div>
          ) : viewMode === "grid" ? (
            <BookingGrid bookings={bookings} loading={loading} onUpdateStatus={handleStatusUpdate} onDelete={handleDeleteBooking} />
          ) : viewMode === "table" ? (
            <BookingTable bookings={bookings} loading={loading} onUpdateStatus={handleStatusUpdate} onDelete={handleDeleteBooking} />
          ) : (
            <BookingCalendar bookings={bookings} loading={loading} onUpdateStatus={handleStatusUpdate} />
          )}

        </CardContent>
      </Card>
    </div>
  );
};

export default AdminBookings;
