import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { spaceFormSchema, SpaceFormValues } from "../../types/space";
import { BasicInfo } from "./spaces/components/BasicInfo";
import { CapacitySlider } from "./spaces/CapacitySlider";
import { PricingTypeRadioGroup } from "./spaces/PricingTypeRadioGroup";
import { PricingFields } from "./spaces/PricingFields";
import { SpaceStatus } from "./spaces/components/SpaceStatus";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { PricingType } from "./spaces/types";

interface SpaceFormProps {
  initialData?: Partial<SpaceFormValues>;
  onSubmit: (values: SpaceFormValues) => Promise<void>;
  isDisabled?: boolean;
}

export function SpaceForm({ initialData, onSubmit, isDisabled = false }: SpaceFormProps) {
  const { toast } = useToast();
  const [pricingType, setPricingType] = useState<PricingType>(initialData?.pricing_type || "hourly");
  
  const form = useForm<SpaceFormValues>({
    resolver: zodResolver(spaceFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      is_active: initialData?.is_active ?? true,
      capacity: initialData?.capacity || 1,
      hourly_price: initialData?.hourly_price || 0,
      daily_price: initialData?.daily_price || 0,
      monthly_price: initialData?.monthly_price || 0,
      yearly_price: initialData?.yearly_price || 0,
      custom_price: initialData?.custom_price || 0,
      pricing_type: initialData?.pricing_type || "hourly",
      description: initialData?.description || "",
      custom_label: initialData?.custom_label || "",
    },
  });

  const handleSubmit = async (values: SpaceFormValues) => {
    try {
      await onSubmit(values);
      toast({
        title: "Succès",
        description: "L'espace a été sauvegardé avec succès",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue",
        variant: "destructive",
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Informations de base</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <BasicInfo control={form.control} />
            <CapacitySlider control={form.control} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tarification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <PricingTypeRadioGroup 
              control={form.control} 
              onPricingTypeChange={setPricingType}
              defaultValue={pricingType}
            />
            <PricingFields 
              control={form.control} 
              pricingType={pricingType}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Statut</CardTitle>
          </CardHeader>
          <CardContent>
            <SpaceStatus control={form.control} />
          </CardContent>
        </Card>

        <CardFooter className="flex justify-end space-x-2">
          <Button type="submit" disabled={isDisabled}>
            Sauvegarder
          </Button>
        </CardFooter>
      </form>
    </Form>
  );
}
