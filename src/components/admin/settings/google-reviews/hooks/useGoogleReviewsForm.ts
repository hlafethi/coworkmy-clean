import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const googleReviewsSchema = z.object({
  api_key: z.string().min(1, "La clé API est requise"),
  place_id: z.string().min(1, "L'ID du lieu est requis"),
  max_reviews: z.number().min(1).max(100),
  min_rating: z.number().min(1).max(5),
});

export type GoogleReviewsFormValues = z.infer<typeof googleReviewsSchema>;

export function useGoogleReviewsForm() {
  const form = useForm<GoogleReviewsFormValues>({
    resolver: zodResolver(googleReviewsSchema),
    defaultValues: {
      api_key: "",
      place_id: "",
      max_reviews: 10,
      min_rating: 4,
    },
  });

  return {
    form,
  };
}
