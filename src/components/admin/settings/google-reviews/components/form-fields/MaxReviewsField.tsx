import { Control } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Slider } from "@/components/ui/slider";
import type { GoogleReviewsFormValues } from "../../hooks/useGoogleReviewsForm";

interface MaxReviewsFieldProps {
  control: Control<GoogleReviewsFormValues>;
}

export function MaxReviewsField({ control }: MaxReviewsFieldProps) {
  return (
    <FormField
      control={control}
      name="max_reviews"
      render={({ field: { value, onChange } }) => (
        <FormItem>
          <FormLabel>Nombre maximum d'avis à afficher</FormLabel>
          <FormControl>
            <div className="space-y-2">
              <Slider
                min={1}
                max={100}
                step={1}
                value={[value]}
                onValueChange={(vals) => onChange(vals[0])}
              />
              <div className="text-center font-medium">{value} avis</div>
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
