import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import type { SettingsFormValues } from "@/types/settings";

interface GeneralSettingsTabProps {
  form: UseFormReturn<SettingsFormValues>;
  isDisabled?: boolean;
}

export function GeneralSettingsTab({ form, isDisabled }: GeneralSettingsTabProps) {
  return (
    <div>
      <div>
        <h3 className="text-lg font-medium">Paramètres généraux</h3>
        <p className="text-sm text-muted-foreground">
          Configurez les informations générales de votre espace de coworking.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
        <FormField
          control={form.control}
          name="homepage.title"
          render={({ field }) => {
            const id = "homepage_title";
            return (
              <FormItem>
                <FormLabel htmlFor={id}>Titre de la page d'accueil</FormLabel>
                <FormControl>
                  <Input
                    id={id}
                    {...field}
                    value={field.value ?? ""}
                    placeholder="Bienvenue sur Co Work My"
                    disabled={isDisabled}
                  />
                </FormControl>
                <FormDescription>
                  Ce titre apparaîtra sur la page d'accueil du site.
                </FormDescription>
                <FormMessage />
              </FormItem>
            );
          }}
        />
      </div>
    </div>
  );
}
