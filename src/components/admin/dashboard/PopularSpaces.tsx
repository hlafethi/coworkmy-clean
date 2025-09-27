import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdminStats } from "@/hooks/useAdminStats";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Building2 } from "lucide-react";

interface Space {
  id: string;
  name: string;
  bookings_count: number;
}

export const PopularSpaces = () => {
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
        {error || "Une erreur est survenue lors du chargement des espaces populaires"}
      </AlertDescription>
    </Alert>
  );

  // Composant de données
  const SpacesDisplay = () => {
    const spaces: Space[] = stats?.popular_spaces || [];

    if (spaces.length === 0) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Espaces Populaires</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Aucun espace disponible</p>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Espaces Populaires</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {spaces.map((space) => (
              <div key={space.id} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{space.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {space.bookings_count} réservations
                  </p>
                </div>
                <Building2 className="h-4 w-4 text-muted-foreground" />
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

  return <SpacesDisplay />;
};
