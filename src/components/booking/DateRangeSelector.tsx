import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";

export interface DateRangeSelectorProps {
  selectedDays: Date[];
  onDaysChange: (days: Date[]) => void;
}

export function DateRangeSelector({
  selectedDays,
  onDaysChange
}: DateRangeSelectorProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-4">Sélectionnez vos dates</h3>
        <Calendar
          mode="multiple"
          selected={selectedDays}
          onSelect={(days) => days && onDaysChange(days)}
          className="rounded-md border"
        />
      </CardContent>
    </Card>
  );
}
