import { z } from "zod";

export type PricingType = "hourly" | "daily" | "monthly" | "yearly" | "half_day" | "quarter" | "custom";

export const spaceFormSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  description: z.string().optional(),
  capacity: z.number().min(1, "La capacité doit être d'au moins 1"),
  is_active: z.boolean(),
  pricing_type: z.enum(["hourly", "daily", "monthly", "yearly", "half_day", "quarter", "custom"]),
  hourly_price: z.number().min(0),
  daily_price: z.number().min(0),
  monthly_price: z.number().min(0),
  yearly_price: z.number().min(0),
  half_day_price: z.number().min(0),
  quarter_price: z.number().min(0),
  custom_price: z.number().min(0),
  custom_label: z.string().optional(),
});

export type SpaceFormValues = z.infer<typeof spaceFormSchema>; 