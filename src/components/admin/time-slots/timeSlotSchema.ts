import * as z from "zod";

export const timeSlotFormSchema = z.object({
  id: z.string().optional(),
  label: z.string().min(2, "Le libellé doit comporter au moins 2 caractères"),
  start_time: z.string().min(1, "L'heure de début est requise"),
  end_time: z.string().min(1, "L'heure de fin est requise"),
  space_id: z.string().optional(),
  display_order: z.number().optional(),
});

export type TimeSlotFormValues = z.infer<typeof timeSlotFormSchema>;
