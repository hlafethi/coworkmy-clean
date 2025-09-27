export type PricingType = "hourly" | "daily" | "half_day" | "monthly" | "quarter" | "yearly" | "custom";

export type SpaceFormData = Omit<Space, "created_at" | "updated_at">;

export type { SpaceFormValues } from "./hooks/useSpaceForm";
