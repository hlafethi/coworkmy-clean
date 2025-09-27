import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ConnectionTest } from "../ConnectionTest";
import { UseFormReturn } from "react-hook-form";
import { GoogleReviewsFormValues } from "../../hooks/useGoogleReviewsForm";

interface PlaceIdFieldProps {
  form: UseFormReturn<GoogleReviewsFormValues>;
  isDisabled: boolean;
  placeId: string;
  apiKey: string;
  onTest: (apiKey: string, placeId: string) => Promise<void>;
  isLoading: boolean;
  placeName: string | null;
}

export function PlaceIdField({ form, isDisabled, placeId, apiKey, onTest, isLoading, placeName }: PlaceIdFieldProps) {
  return (
    <FormField
      control={form.control}
      name="place_id"
      render={({ field }) => (
        <FormItem>
          <FormLabel>ID de l'établissement (Place ID)</FormLabel>
          <FormControl>
            <Input 
              placeholder="ChIJrTLr-GyuEmsRBfy61i59si0" 
              {...field} 
              disabled={isDisabled} 
            />
          </FormControl>
          <FormDescription>
            L'identifiant unique de votre établissement sur Google. Trouvez-le sur Google Maps ou le Google Business Profile.
          </FormDescription>
          <FormMessage />
          <ConnectionTest
            apiKey={apiKey}
            placeId={placeId}
            onTest={onTest}
            isLoading={isLoading}
            placeName={placeName}
          />
        </FormItem>
      )}
    />
  );
}
