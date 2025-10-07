import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
// Logger supprimé - utilisation de console directement
const googleApiKeysSchema = z.object({
  api_key: z.string().min(1, "La clé API est requise"),
  place_id: z.string().min(1, "L'ID du lieu est requis"),
});

type GoogleApiKeysFormValues = z.infer<typeof googleApiKeysSchema>;

export function GoogleApiKeysForm() {
  const { toast } = useToast();
  const form = useForm<GoogleApiKeysFormValues>({
    resolver: zodResolver(googleApiKeysSchema),
    defaultValues: {
      api_key: "",
      place_id: "",
    },
  });

  const onSubmit = async (data: GoogleApiKeysFormValues) => {
    try {
      const { error } = await supabase
        .from("google_api_keys")
        .upsert({
          api_key: data.api_key,
          place_id: data.place_id,
        });

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Les clés API ont été enregistrées avec succès.",
      });
    } catch (error) {
      console.error("Erreur lors de l'enregistrement des clés:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'enregistrement des clés.",
        variant: "destructive",
      });
    }
  };

  return (
    <Form {...form}>
      <div className="space-y-4">
        <FormField
          control={form.control}
          name="api_key"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Clé API Google</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="Entrez votre clé API Google"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="place_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ID du lieu Google</FormLabel>
              <FormControl>
                <Input
                  placeholder="Entrez l'ID de votre lieu Google"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="button" onClick={form.handleSubmit(onSubmit)}>
          Enregistrer les clés
        </Button>
      </div>
    </Form>
  );
} 