import { Control } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Slider } from "@/components/ui/slider";
import type { GoogleReviewsFormValues } from "../../hooks/useGoogleReviewsForm";

interface MinRatingFieldProps {
  control: Control<GoogleReviewsFormValues>;
}

export function MinRatingField({ control }: MinRatingFieldProps) {
  return (
    <FormField
      control={control}
      name="min_rating"
      render={({ field: { value, onChange } }) => (
        <FormItem>
          <FormLabel>Note minimale requise</FormLabel>
          <FormControl>
            <div className="space-y-2">
              <Slider
                min={1}
                max={5}
                step={1}
                value={[value]}
                onValueChange={(vals) => onChange(vals[0])}
              />
              <div className="text-center font-medium">
                {value} {value === 1 ? "étoile" : "étoiles"}
              </div>
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
