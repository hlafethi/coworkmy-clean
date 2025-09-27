
import { FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Control } from "react-hook-form";
import { SpaceFormValues } from "../types";

interface SpaceStatusProps {
  control: Control<SpaceFormValues>;
}

export const SpaceStatus = ({ control }: SpaceStatusProps) => {
  return (
    <FormField
      control={control}
      name="is_active"
      render={({ field }) => (
        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
          <div className="space-y-0.5">
            <FormLabel>Disponible</FormLabel>
            <div className="text-sm text-muted-foreground">
              L'espace sera visible et disponible à la réservation
            </div>
          </div>
          <FormControl>
            <Switch
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          </FormControl>
        </FormItem>
      )}
    />
  );
};
