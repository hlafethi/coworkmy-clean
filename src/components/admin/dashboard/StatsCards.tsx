import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Users, MapPin, Calendar, CreditCard } from "lucide-react";

interface StatsCardsProps {
  totalUsers: number;
  totalSpaces: number;
  totalBookings: number;
  totalRevenue: number;
  loading: boolean;
}

export const StatsCards = ({ totalUsers, totalSpaces, totalBookings, totalRevenue, loading }: StatsCardsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <h2 className="text-sm font-medium">Utilisateurs</h2>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {loading ? "..." : totalUsers}
          </div>
          <p className="text-xs text-muted-foreground">
            utilisateurs enregistrés
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <h2 className="text-sm font-medium">Espaces</h2>
          <MapPin className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {loading ? "..." : totalSpaces}
          </div>
          <p className="text-xs text-muted-foreground">
            espaces disponibles
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <h2 className="text-sm font-medium">Réservations</h2>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {loading ? "..." : totalBookings}
          </div>
          <p className="text-xs text-muted-foreground">
            réservations au total
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <h2 className="text-sm font-medium">Revenus</h2>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {loading ? "..." : `${totalRevenue} €`}
          </div>
          <p className="text-xs text-muted-foreground">
            de revenus totaux
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
