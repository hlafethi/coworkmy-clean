import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Building2, TrendingUp, Users } from 'lucide-react';

interface Space {
  id: string;
  name: string;
  bookings_count: number;
}

interface PopularSpacesProps {
  spaces: Space[];
  loading: boolean;
}

export const PopularSpaces = ({ spaces, loading }: PopularSpacesProps) => {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Populaires
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
                <Skeleton className="h-4 w-[60px]" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (spaces.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Populaires
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Aucun espace avec des réservations</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Espaces populaires
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {spaces.map((space, index) => (
            <div key={space.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground rounded-full text-sm font-bold">
                  {index + 1}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{space.name}</h4>
                  <p className="text-sm text-gray-500">Espace de coworking</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Users className="h-4 w-4" />
                <span className="font-medium">{space.bookings_count}</span>
                <span>réservations</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};