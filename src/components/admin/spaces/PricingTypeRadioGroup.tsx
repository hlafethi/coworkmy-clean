import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Control } from "react-hook-form";
import { PricingType, SpaceFormValues } from "./types";

interface PricingTypeRadioGroupProps {
  control: Control<SpaceFormValues>;
  onPricingTypeChange: (value: PricingType) => void;
  defaultValue?: PricingType;
}

export const PricingTypeRadioGroup = ({
  control,
  onPricingTypeChange,
  defaultValue = "hourly"
}: PricingTypeRadioGroupProps) => {
  return (
    <FormField
      control={control}
      name="pricing_type"
      render={() => (
        <FormItem className="space-y-3">
          <FormLabel>Type de tarification</FormLabel>
          <FormControl>
            <RadioGroup
              onValueChange={value => onPricingTypeChange(value as PricingType)}
              defaultValue={defaultValue}
              className="flex flex-col space-y-1"
            >
              <FormItem className="flex items-center space-x-3 space-y-0">
                <FormControl>
                  <RadioGroupItem value="hourly" />
                </FormControl>
                <FormLabel className="font-normal">Tarif horaire</FormLabel>
              </FormItem>
              <FormItem className="flex items-center space-x-3 space-y-0">
                <FormControl>
                  <RadioGroupItem value="daily" />
                </FormControl>
                <FormLabel className="font-normal">Tarif journalier</FormLabel>
              </FormItem>
              <FormItem className="flex items-center space-x-3 space-y-0">
                <FormControl>
                  <RadioGroupItem value="monthly" />
                </FormControl>
                <FormLabel className="font-normal">Tarif mensuel</FormLabel>
              </FormItem>
              <FormItem className="flex items-center space-x-3 space-y-0">
                <FormControl>
                  <RadioGroupItem value="yearly" />
                </FormControl>
                <FormLabel className="font-normal">Tarif annuel</FormLabel>
              </FormItem>
              <FormItem className="flex items-center space-x-3 space-y-0">
                <FormControl>
                  <RadioGroupItem value="half_day" />
                </FormControl>
                <FormLabel className="font-normal">Tarif demi-journée</FormLabel>
              </FormItem>
              <FormItem className="flex items-center space-x-3 space-y-0">
                <FormControl>
                  <RadioGroupItem value="quarter" />
                </FormControl>
                <FormLabel className="font-normal">Tarif trimestriel</FormLabel>
              </FormItem>
              <FormItem className="flex items-center space-x-3 space-y-0">
                <FormControl>
                  <RadioGroupItem value="custom" />
                </FormControl>
                <FormLabel className="font-normal">Tarif personnalisé</FormLabel>
              </FormItem>
            </RadioGroup>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
