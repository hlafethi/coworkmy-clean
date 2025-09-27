
import React from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface BookingsHeaderProps {
  refreshing: boolean;
  onRefresh: () => void;
}

export const BookingsHeader: React.FC<BookingsHeaderProps> = ({ 
  refreshing, 
  onRefresh 
}) => {
  return (
    <div className="flex justify-between items-center">
      <h2 className="text-2xl font-bold">Gestion des réservations</h2>
      <Button onClick={onRefresh} disabled={refreshing} variant="outline">
        <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
        {refreshing ? 'Actualisation...' : 'Actualiser'}
      </Button>
    </div>
  );
};
