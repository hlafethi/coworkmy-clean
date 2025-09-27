import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface StatsCardsProps {
  totalBookings: number;
  upcomingBookings: number;
}

export const StatsCards = ({ totalBookings, upcomingBookings }: StatsCardsProps) => {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Mes réservations</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalBookings}</div>
          <p className="text-xs text-muted-foreground">
            réservations au total
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Réservations à venir</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{upcomingBookings}</div>
          <p className="text-xs text-muted-foreground">
            {upcomingBookings === 1 ? "réservation prochaine" : "réservations prochaines"}
          </p>
        </CardContent>
      </Card>

      <Card className="relative overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Réserver un espace</CardTitle>
          <Building className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <Button 
            className="w-full"
            onClick={() => navigate("/spaces")}
          >
            Nouvelle réservation
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
