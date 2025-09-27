
import React from "react";
import { MapPin } from "lucide-react";

interface SpaceInfoProps {
  spaceName: string;
}

export const SpaceInfo: React.FC<SpaceInfoProps> = ({ spaceName }) => {
  return (
    <div className="flex items-center gap-2">
      <MapPin className="h-4 w-4 text-gray-400" />
      <span>{spaceName}</span>
    </div>
  );
};
