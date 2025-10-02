import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { Space, TimeSlotOption } from "@/types/booking";

interface BookingSummaryProps {
  space: Space;
  selectedDays: Date[];
  selectedTimeSlot: TimeSlotOption | undefined;
  isRecurring: boolean;
  dateRange?: { from: Date; to: Date };
  termsAccepted: boolean;
  onTermsChange: (accepted: boolean) => void;
  onSubmit: () => void;
}

export function BookingSummary({
  space,
  selectedDays,
  selectedTimeSlot,
  isRecurring,
  dateRange,
  termsAccepted,
  onTermsChange,
  onSubmit
}: BookingSummaryProps) {
  const calculateTotal = () => {
    if (!selectedTimeSlot) return 0;
    // Le prix du slot est maintenant TTC (après multiplication par 1.2 dans useBooking)
    return selectedDays.length * selectedTimeSlot.price;
  };

  const formatDate = (date: Date) => {
    return format(date, "EEEE d MMMM yyyy", { locale: fr });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Récapitulatif de la réservation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="font-medium mb-2">Espace</h3>
          <p className="text-muted-foreground">{space.name}</p>
        </div>

        <div>
          <h3 className="font-medium mb-2">Dates sélectionnées</h3>
          {isRecurring && dateRange ? (
            <p className="text-muted-foreground">
              Du {formatDate(dateRange.from)} au {formatDate(dateRange.to)}
            </p>
          ) : (
            <ul className="list-disc list-inside text-muted-foreground">
              {selectedDays.map((day, index) => (
                <li key={index}>{formatDate(day)}</li>
              ))}
            </ul>
          )}
        </div>

        {selectedTimeSlot && (
          <div>
            <h3 className="font-medium mb-2">Créneau horaire</h3>
            <p className="text-muted-foreground">
              {selectedTimeSlot.startTime} - {selectedTimeSlot.endTime}
            </p>
          </div>
        )}

        <div>
          <h3 className="font-medium mb-2">Prix total</h3>
          <p className="text-2xl font-bold text-primary">{calculateTotal()}€</p>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="terms"
            checked={termsAccepted}
            onCheckedChange={(checked) => onTermsChange(checked as boolean)}
          />
          <Label htmlFor="terms" className="text-sm">
            J'accepte les conditions générales de réservation
          </Label>
        </div>

        <Button
          className="w-full"
          disabled={!selectedTimeSlot || selectedDays.length === 0 || !termsAccepted}
          onClick={onSubmit}
        >
          Confirmer la réservation
        </Button>
      </CardContent>
    </Card>
  );
}
