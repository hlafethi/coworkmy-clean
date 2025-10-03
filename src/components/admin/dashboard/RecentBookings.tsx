import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

interface RecentBookingsProps {
  stats: any;
  loading: boolean;
  error: string | null;
}

export const RecentBookings = ({ stats, loading, error }: RecentBookingsProps) => {

  // Composant de chargement
  const LoadingSkeleton = () => (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">
          <Skeleton className="h-4 w-[140px]" />
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-1">
          {[...Array(2)].map((_, index) => (
            <div key={index} className="flex items-center justify-between py-1 px-2 bg-gray-50 rounded">
              <div className="flex-1 min-w-0">
                <Skeleton className="h-3 w-[100px] mb-1" />
                <Skeleton className="h-2 w-[60px]" />
              </div>
              <Skeleton className="h-4 w-[50px] rounded-full" />
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
    // Limiter à 2 réservations pour l'affichage compact en colonnes
    const limitedBookings = bookings.slice(0, 2);

    if (bookings.length === 0) {
      return (
        <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Réservations Récentes</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-xs text-muted-foreground">Aucune réservation récente</p>
        </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">
            Réservations Récentes
            {bookings.length > 2 && (
              <span className="text-xs text-muted-foreground ml-1">
                ({limitedBookings.length}/{bookings.length})
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-1">
            {limitedBookings.map((booking) => (
              <div key={booking.id} className="flex items-center justify-between py-1 px-2 bg-gray-50 rounded">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="font-medium text-xs truncate">
                      {booking.user_name}
                    </span>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs font-medium truncate">
                      {booking.space_name}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {booking.created_at}
                  </div>
                </div>
                <div className="ml-1 flex-shrink-0">
                  <span className={`text-xs px-1 py-0.5 rounded-full font-medium ${
                    booking.status === 'confirmed' 
                      ? 'bg-green-100 text-green-700' 
                      : booking.status === 'pending' 
                        ? 'bg-yellow-100 text-yellow-700' 
                        : 'bg-gray-100 text-gray-700'
                  }`}>
                    {booking.status}
                  </span>
                </div>
              </div>
            ))}
            {bookings.length > 2 && (
              <div className="text-center pt-1">
                <span className="text-xs text-muted-foreground">
                  +{bookings.length - 2} autres
                </span>
              </div>
            )}
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
