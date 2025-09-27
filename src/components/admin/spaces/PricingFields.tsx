import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Control } from "react-hook-form";
import { PricingType, SpaceFormValues } from "./types";


const PriceInput = ({ 
  control, 
  name, 
  label, 
  step = 0.5
}: { 
  control: Control<SpaceFormValues>;
  name: any;
  label: string;
  step?: number;
}) => {

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const priceHT = isNaN(field.value) || field.value === undefined ? 0 : field.value;
        const priceTTC = priceHT * 1.20;

        return (
          <FormItem>
            <FormLabel>{label}</FormLabel>
            <div className="space-y-2">
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  step={step}
                  value={priceHT}
                  onChange={(e) => field.onChange(parseFloat(e.target.value))}
                />
              </FormControl>
              <div className="text-sm text-muted-foreground">
                Prix TTC: {priceTTC.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
              </div>
            </div>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
};

interface PricingFieldsProps {
  control: Control<SpaceFormValues>;
  pricingType: PricingType;
}

export const PricingFields = ({ control, pricingType }: PricingFieldsProps) => {
  if (pricingType === "hourly") {
    return (
      <PriceInput
        control={control}
        name="hourly_price"
        label="Prix horaire HT (€)"
        step={0.5}
      />
    );
  }

  if (pricingType === "daily") {
    return (
      <PriceInput
        control={control}
        name="daily_price"
        label="Prix journalier HT (€)"
        step={1}
      />
    );
  }

  if (pricingType === "monthly") {
    return (
      <PriceInput
        control={control}
        name="monthly_price"
        label="Prix mensuel HT (€)"
        step={10}
      />
    );
  }

  if (pricingType === "half_day") {
    return (
      <PriceInput
        control={control}
        name="half_day_price"
        label="Prix demi-journée HT (€)"
        step={0.5}
      />
    );
  }

  if (pricingType === "quarter") {
    return (
      <PriceInput
        control={control}
        name="quarter_price"
        label="Prix trimestriel HT (€)"
        step={1}
      />
    );
  }

  if (pricingType === "yearly") {
    return (
      <PriceInput
        control={control}
        name="yearly_price"
        label="Prix annuel HT (€)"
        step={100}
      />
    );
  }

  if (pricingType === "custom") {
    return (
      <>
        <FormField
          control={control}
          name="custom_label"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom de la période</FormLabel>
              <FormControl>
                <Input
                  placeholder="Par semaine, par événement, etc."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <PriceInput
          control={control}
          name="custom_price"
          label="Prix personnalisé HT (€)"
          step={1}
        />
      </>
    );
  }

  return null;
};
