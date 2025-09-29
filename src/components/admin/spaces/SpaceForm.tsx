import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CapacitySlider } from "./CapacitySlider";
import { PricingTypeRadioGroup } from "./PricingTypeRadioGroup";
import { PricingFields } from "./PricingFields";
import { SpaceStatus } from "./components/SpaceStatus";
import { BasicInfo } from "./components/BasicInfo";
import { useSpaceForm, type SpaceFormValues } from "./hooks/useSpaceForm";
import { type SpaceFormData, type PricingType } from "./types";
import { useState } from "react";
import { Form } from "@/components/ui/form";

interface SpaceFormProps {
  defaultValues?: SpaceFormData;
  onSubmit: (values: SpaceFormValues) => Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

export function SpaceForm({ defaultValues, onSubmit, onCancel, isSubmitting }: SpaceFormProps) {
  const { form, handleSubmit } = useSpaceForm({
    defaultValues,
    onSubmit,
  });

  const [pricingType, setPricingType] = useState<PricingType>(defaultValues?.pricing_type || "hourly");
  const [timeSlots, setTimeSlots] = useState<Array<{id: string; startTime: string; endTime: string; label: string}>>([]);

  const handlePricingTypeChange = (value: PricingType) => {
    setPricingType(value);
  };

  const handleTimeSlotsChange = (slots: Array<{id: string; startTime: string; endTime: string; label: string}>) => {
    setTimeSlots(slots);
    form.setValue('time_slots', slots);
  };

  // Protection contre form null/undefined
  if (!form) {
    console.error("[SpaceForm] form est null ou undefined !", form);
    return <div className="text-red-500">Erreur critique du formulaire. Veuillez recharger la page.</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Informations de l'espace</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <BasicInfo form={form} />
            <CapacitySlider control={form.control} />
            <PricingTypeRadioGroup 
              control={form.control} 
              onPricingTypeChange={handlePricingTypeChange}
              defaultValue={pricingType}
            />
            <PricingFields 
              control={form.control} 
              pricingType={pricingType}
              onTimeSlotsChange={handleTimeSlotsChange}
            />
            <SpaceStatus control={form.control} />
            <div className="flex justify-end space-x-2">
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel}>
                  Annuler
                </Button>
              )}
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
