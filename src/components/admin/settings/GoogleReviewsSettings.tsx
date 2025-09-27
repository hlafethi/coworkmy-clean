import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ReviewsSettingsForm } from "./google-reviews/components/ReviewsSettingsForm";

const googleReviewsSchema = z.object({
  api_key: z.string().min(1, "La clé API est requise"),
  place_id: z.string().min(1, "L'ID du lieu est requis"),
  max_reviews: z.number().min(1).max(100),
  min_rating: z.number().min(1).max(5),
});

type GoogleReviewsFormValues = z.infer<typeof googleReviewsSchema>;

export function GoogleReviewsSettings() {
  const form = useForm<GoogleReviewsFormValues>({
    resolver: zodResolver(googleReviewsSchema),
    defaultValues: {
      api_key: "",
      place_id: "",
      max_reviews: 10,
      min_rating: 4,
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Connexion à Google Avis</CardTitle>
        <CardDescription>
          Configurez la connexion à l'API Google My Business pour afficher les avis clients
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ReviewsSettingsForm control={form.control} />
      </CardContent>
    </Card>
  );
}
