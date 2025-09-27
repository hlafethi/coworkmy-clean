import { Control } from "react-hook-form";
import type { GoogleReviewsFormValues } from "../hooks/useGoogleReviewsForm";
import { MaxReviewsField } from "./form-fields/MaxReviewsField";
import { MinRatingField } from "./form-fields/MinRatingField";

interface ReviewsSettingsFormProps {
  control: Control<GoogleReviewsFormValues>;
}

export function ReviewsSettingsForm({ control }: ReviewsSettingsFormProps) {
  return (
    <div className="space-y-4">
      <MaxReviewsField control={control} />
      <MinRatingField control={control} />
    </div>
  );
}
