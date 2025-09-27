import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import type { Space } from "@/components/admin/spaces/types";
import { formatPrice } from "@/utils/bookingUtils";


interface SpaceSelectorProps {
  spaces: Space[];
  selected: string;
  onSelect: (value: string) => void;
  loading: boolean;
  getSpacePrice: (space: Space | undefined) => { ht: number; ttc: number };
  getPricingLabel: (space: Space | undefined) => string;
}

export const SpaceSelector = ({
  spaces,
  selected,
  onSelect,
  loading,
  getSpacePrice,
  getPricingLabel
}: SpaceSelectorProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Type d'espace</CardTitle>
        <CardDescription>
          Sélectionnez l'espace qui répond le mieux à vos besoins.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-center py-6">Chargement des espaces en cours...</p>
        ) : spaces.length === 0 ? (
          <p className="text-center py-6">Aucun espace n'est disponible pour le moment.</p>
        ) : (
          <RadioGroup value={selected} onValueChange={onSelect}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {spaces.map((space) => (
                <Label
                  key={space.id}
                  htmlFor={space.id}
                  className={`relative block border p-4 rounded-lg transition-colors cursor-pointer hover:border-primary ${selected === space.id ? "border-primary bg-accent/20" : "border-gray-200"
                    }`}
                >
                  <RadioGroupItem
                    value={space.id}
                    id={space.id}
                    className="absolute right-4 top-4"
                  />
                  <div className="font-medium text-lg mb-2">
                    {space.name}
                  </div>
                  <div className="text-sm space-y-1 mb-3">
                    <p className="text-gray-600">HT: {formatPrice(getSpacePrice(space).ht)}{getPricingLabel(space).replace('€', '')}</p>
                    <p className="text-gray-900">TTC: {formatPrice(getSpacePrice(space).ttc)}{getPricingLabel(space).replace('€', '')}</p>
                  </div>
                  <p className="text-gray-500 text-sm line-clamp-2">{space.description}</p>
                </Label>
              ))}
            </div>
          </RadioGroup>
        )}
      </CardContent>
    </Card>
  );
};
