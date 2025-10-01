import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface SpacesFilterProps {
  filter: 'all' | 'active' | 'inactive';
  setFilter: (filter: 'all' | 'active' | 'inactive') => void;
  allSpaces: any[];
}

export const SpacesFilter: React.FC<SpacesFilterProps> = ({ 
  filter, 
  setFilter, 
  allSpaces 
}) => {
  const activeCount = allSpaces.filter(space => space.is_active).length;
  const inactiveCount = allSpaces.filter(space => !space.is_active).length;
  const totalCount = allSpaces.length;

  return (
    <div className="flex items-center gap-2 mb-4">
      <span className="text-sm font-medium text-muted-foreground">Filtrer :</span>
      
      <Button
        variant={filter === 'all' ? 'default' : 'outline'}
        size="sm"
        onClick={() => setFilter('all')}
        className="flex items-center gap-2"
      >
        Tous
        <Badge variant="secondary" className="ml-1">
          {totalCount}
        </Badge>
      </Button>
      
      <Button
        variant={filter === 'active' ? 'default' : 'outline'}
        size="sm"
        onClick={() => setFilter('active')}
        className="flex items-center gap-2"
      >
        Actifs
        <Badge variant="secondary" className="ml-1">
          {activeCount}
        </Badge>
      </Button>
      
      <Button
        variant={filter === 'inactive' ? 'default' : 'outline'}
        size="sm"
        onClick={() => setFilter('inactive')}
        className="flex items-center gap-2"
      >
        Inactifs
        <Badge variant="secondary" className="ml-1">
          {inactiveCount}
        </Badge>
      </Button>
    </div>
  );
};
