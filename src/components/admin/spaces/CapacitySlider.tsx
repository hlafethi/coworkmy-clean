import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Slider } from "@/components/ui/slider";
import { Control } from "react-hook-form";
import { SpaceFormValues } from "./types";

interface CapacitySliderProps {
  control: Control<SpaceFormValues>;
}

export const CapacitySlider = ({ control }: CapacitySliderProps) => {
  return (
    <FormField
      control={control}
      name="capacity"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Capacité: {field.value} personnes</FormLabel>
          <FormControl>
            <Slider
              min={1}
              max={50}
              step={1}
              value={[field.value]}
              onValueChange={(value) => {
                field.onChange(value[0]);
              }}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
