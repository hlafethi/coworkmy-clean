import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdminStats } from "@/hooks/useAdminStats";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface Booking {
  id: string;
  space_name: string;
  user_name: string;
  created_at: string;
  status: string;
  company?: string;
}

export const RecentBookings = () => {
  const { stats, loading, error } = useAdminStats();

  // Composant de chargement
  const LoadingSkeleton = () => (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">
          <Skeleton className="h-6 w-[200px]" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-4 w-[150px]" />
                <Skeleton className="h-3 w-[100px]" />
              </div>
              <Skeleton className="h-4 w-[80px]" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  // Composant d'erreur
  const ErrorDisplay = () => (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Erreur</AlertTitle>
      <AlertDescription>
        {error || "Une erreur est survenue lors du chargement des réservations récentes"}
      </AlertDescription>
    </Alert>
  );

  // Composant de données
  const BookingsDisplay = () => {
    const bookings: Booking[] = stats?.recent_bookings || [];

    if (bookings.length === 0) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Réservations Récentes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Aucune réservation récente</p>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Réservations Récentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div key={booking.id} className="flex flex-col md:flex-row md:items-center md:justify-between border-b pb-2 last:border-b-0 last:pb-0">
                <div>
                  <span className="font-medium">
                    {booking.user_name}
                    {booking.company ? ` (${booking.company})` : ''}
                  </span>
                  {" a réservé "}
                  <span className="font-semibold">{booking.space_name}</span>
                  {" le "}
                  <span>{booking.created_at}</span>
                </div>
                <div className="text-right mt-1 md:mt-0">
                  <span className={`text-xs px-2 py-1 rounded-full ${booking.status === 'confirmed' ? 'bg-green-100 text-green-800' : booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>{booking.status}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return <ErrorDisplay />;
  }

  return <BookingsDisplay />;
};
