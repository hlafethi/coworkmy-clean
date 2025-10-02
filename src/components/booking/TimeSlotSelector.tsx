import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import type { TimeSlotOption } from "@/types/booking";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface TimeSlotSelectorProps {
  timeSlots: TimeSlotOption[];
  selectedSlot: TimeSlotOption | undefined;
  onSlotSelect: (slot: TimeSlotOption) => void;
  space: any;
}

export function TimeSlotSelector({ timeSlots, selectedSlot, onSlotSelect, space }: TimeSlotSelectorProps) {
  if (timeSlots.length === 0) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Créneaux horaires</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="warning" className="mt-4">
            <AlertTitle>Aucun créneau disponible</AlertTitle>
            <AlertDescription>
              {space?.pricing_type === 'monthly' 
                ? `Tarif mensuel non configuré (actuel : ${space?.monthly_price}€)`
                : 'Contactez l\'administrateur'}
            </AlertDescription>
          </Alert>
          <div className="mt-2 text-red-600 text-sm">
            ⚠️ Vérifiez que le champ de prix correspondant (ex: daily_price, half_day_price, etc.) est bien renseigné dans Supabase pour cet espace.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Créneaux horaires</CardTitle>
      </CardHeader>
      <CardContent>
        <RadioGroup
          value={selectedSlot?.id || ""}
          onValueChange={(value) => {
            const slot = timeSlots.find((s) => s.id === value);
            if (slot) onSlotSelect(slot);
          }}
          className="space-y-4"
        >
          {timeSlots.map((slot) => {
            const priceTTC = slot.price ?? 0;
            const priceHT = Math.round(priceTTC / 1.2 * 100) / 100;
            return (
              <div key={slot.id} className="flex flex-col space-y-1">
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value={slot.id} id={slot.id} />
                  <Label htmlFor={slot.id} className="flex-1">
                    <div className="flex justify-between items-center">
                      <span>{slot.label}</span>
                      <span className="flex flex-col items-end">
                        <span>{priceHT} € HT</span>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="text-primary font-medium cursor-pointer underline decoration-dotted">{priceTTC} € TTC</span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <span>TVA 20% incluse</span>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </span>
                    </div>
                  </Label>
                </div>
                {slot.priceMissing && (
                  <div className="text-red-600 text-xs ml-8">⚠️ Prix manquant ou à 0 pour ce type d'espace. Corrige le champ dans Supabase.</div>
                )}
              </div>
            );
          })}
        </RadioGroup>
      </CardContent>
    </Card>
  );
}
