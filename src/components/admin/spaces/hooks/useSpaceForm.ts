import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { SpaceFormData } from "../types";
import { useEffect } from "react";
// Logger supprimé - utilisation de console directement
const spaceFormSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, {
    message: "Le nom doit contenir au moins 2 caractères.",
  }),
  description: z.string().optional(),
  capacity: z.number().min(1, {
    message: "La capacité doit être d'au moins 1 personne.",
  }),
  hourly_price: z.number().min(0, {
    message: "Le prix horaire ne peut pas être négatif.",
  }),
  daily_price: z.number().min(0, {
    message: "Le prix journalier ne peut pas être négatif.",
  }),
  half_day_price: z.number().min(0, {
    message: "Le prix demi-journée ne peut pas être négatif.",
  }),
  monthly_price: z.number().min(0, {
    message: "Le prix mensuel ne peut pas être négatif.",
  }),
  quarter_price: z.number().min(0, {
    message: "Le prix trimestriel ne peut pas être négatif.",
  }),
  yearly_price: z.number().min(0, {
    message: "Le prix annuel ne peut pas être négatif.",
  }),
  custom_price: z.number().min(0, {
    message: "Le prix ne peut pas être négatif.",
  }),
  custom_label: z.string().optional(),
  pricing_type: z.enum(["hourly", "daily", "half_day", "monthly", "quarter", "yearly", "custom"]),
  is_active: z.boolean().default(true),
  image_url: z.string().optional(),
  time_slots: z.array(z.object({
    id: z.string(),
    startTime: z.string(),
    endTime: z.string(),
    label: z.string()
  })).optional(),
}).refine((data) => {
  // Validation conditionnelle selon le type de tarification
  switch (data.pricing_type) {
    case 'hourly':
      return data.hourly_price > 0 || { message: "Le prix horaire doit être supérieur à 0" };
    case 'daily':
      return data.daily_price > 0 || { message: "Le prix journalier doit être supérieur à 0" };
    case 'half_day':
      return data.half_day_price > 0 || { message: "Le prix demi-journée doit être supérieur à 0" };
    case 'monthly':
      return data.monthly_price > 0 || { message: "Le prix mensuel doit être supérieur à 0" };
    case 'quarter':
      return data.quarter_price > 0 || { message: "Le prix trimestriel doit être supérieur à 0" };
    case 'yearly':
      return data.yearly_price > 0 || { message: "Le prix annuel doit être supérieur à 0" };
    case 'custom':
      return data.custom_price > 0 || { message: "Le prix personnalisé doit être supérieur à 0" };
    default:
      return true;
  }
}, {
  message: "Le prix correspondant au type de tarification doit être supérieur à 0",
  path: ["pricing_type"] // Indique que l'erreur est liée au type de tarification
});

export type SpaceFormValues = z.infer<typeof spaceFormSchema>;

interface UseSpaceFormProps {
  defaultValues?: SpaceFormData;
  onSubmit: (values: SpaceFormValues) => Promise<void>;
  onSuccess?: () => void;
}

export const useSpaceForm = ({ defaultValues, onSubmit, onSuccess }: UseSpaceFormProps) => {
  const form = useForm<SpaceFormValues>({
    resolver: zodResolver(spaceFormSchema) as any,
    defaultValues: {
      id: defaultValues?.id ?? "",
      name: defaultValues?.name ?? "",
      description: defaultValues?.description ?? "",
      capacity: defaultValues?.capacity ?? 1,
      hourly_price: defaultValues?.hourly_price ?? 0,
      daily_price: defaultValues?.daily_price ?? 0,
      half_day_price: defaultValues?.half_day_price ?? 0,
      monthly_price: defaultValues?.monthly_price ?? 0,
      quarter_price: defaultValues?.quarter_price ?? 0,
      yearly_price: defaultValues?.yearly_price ?? 0,
      custom_price: defaultValues?.custom_price ?? 0,
      custom_label: defaultValues?.custom_label ?? "",
      pricing_type: defaultValues?.pricing_type ?? "hourly",
      is_active: defaultValues?.is_active ?? true,
      image_url: defaultValues?.image_url ?? "",
      time_slots: defaultValues?.time_slots ?? [],
    },
  });

  // Réinitialiser le formulaire quand defaultValues change (ouverture/fermeture du dialogue)
  useEffect(() => {
    if (defaultValues) {
      form.reset({
        id: defaultValues.id ?? "",
        name: defaultValues.name ?? "",
        description: defaultValues.description ?? "",
        capacity: defaultValues.capacity ?? 1,
        hourly_price: defaultValues.hourly_price ?? 0,
        daily_price: defaultValues.daily_price ?? 0,
        half_day_price: defaultValues.half_day_price ?? 0,
        monthly_price: defaultValues.monthly_price ?? 0,
        quarter_price: defaultValues.quarter_price ?? 0,
        yearly_price: defaultValues.yearly_price ?? 0,
        custom_price: defaultValues.custom_price ?? 0,
        custom_label: defaultValues.custom_label ?? "",
        pricing_type: defaultValues.pricing_type ?? "hourly",
        is_active: defaultValues.is_active ?? true,
        image_url: defaultValues.image_url ?? "",
        time_slots: defaultValues.time_slots ?? [],
      });
    } else {
      // Si pas de defaultValues, réinitialiser avec des valeurs vides (mode ajout)
      form.reset({
        id: "",
        name: "",
        description: "",
        capacity: 1,
        hourly_price: 0,
        daily_price: 0,
        half_day_price: 0,
        monthly_price: 0,
        quarter_price: 0,
        yearly_price: 0,
        custom_price: 0,
        custom_label: "",
        pricing_type: "hourly",
        is_active: true,
        image_url: "",
        time_slots: [],
      });
    }
  }, [defaultValues, form]);

  const handleSubmit: SubmitHandler<SpaceFormValues> = async (values) => {
    try {
      await onSubmit(values);
      form.reset();
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Error submitting space form:", error);
      toast.error("Une erreur est survenue lors de l'enregistrement de l'espace");
    }
  };

  return {
    form,
    handleSubmit: form.handleSubmit(handleSubmit),
  };
};
