import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
// Logger supprimé - utilisation de console directement
// Définition du schéma du formulaire avec des champs requis
const templateSchema = z.object({
  type: z.string().min(1, "Le type est requis"),
  name: z.string().min(1, "Le nom est requis"),
  subject: z.string().min(1, "Le sujet est requis"),
  content: z.string().min(1, "Le contenu est requis"),
});

// Type créé à partir du schéma
type TemplateFormValues = z.infer<typeof templateSchema>;

interface EmailTemplateFormProps {
  mode?: "create" | "edit" | "duplicate";
  initialValues?: {
    id?: string;
    type: string;
    name: string;
    subject: string;
    content: string;
  };
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const EmailTemplateForm = ({ 
  mode = "create", 
  initialValues, 
  onSuccess, 
  onCancel 
}: EmailTemplateFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<TemplateFormValues>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      type: initialValues?.type || "",
      name: initialValues?.name || "",
      subject: initialValues?.subject || "",
      content: initialValues?.content || "",
    },
  });

  // Mettre à jour les valeurs du formulaire quand initialValues change
  useEffect(() => {
    if (initialValues) {
      form.reset({
        type: initialValues.type,
        name: initialValues.name,
        subject: initialValues.subject,
        content: initialValues.content,
      });
    }
  }, [initialValues, form]);

  const onSubmit = async (values: TemplateFormValues) => {
    setIsSubmitting(true);
    try {
      if (mode === "edit" && initialValues?.id) {
        // Mode édition - update
        const result = await apiClient.put(`/email-templates/${initialValues.id}`, {
          type: values.type,
          name: values.name,
          subject: values.subject,
          content: values.content,
        });
        
        if (!result.success) throw new Error(result.message || "Erreur lors de la modification");
        toast.success("Modèle d'email modifié avec succès");
      } else {
        // Mode création ou duplication - insert
        // Vérification d'unicité sur le type seulement en mode création
        if (mode === "create") {
          const existingResult = await apiClient.get("/email-templates");
          if (existingResult.success && Array.isArray(existingResult.data)) {
            const existing = existingResult.data.find((template: any) => template.type === values.type);
            if (existing) {
              toast.error("Un modèle avec ce type existe déjà. Modifiez-le ou choisissez un autre type.");
              setIsSubmitting(false);
              return;
            }
          }
        }

        const result = await apiClient.post("/email-templates", {
          type: values.type,
          name: values.name,
          subject: values.subject,
          content: values.content,
        });
        
        if (!result.success) throw new Error(result.message || "Erreur lors de la création");
        toast.success(mode === "duplicate" ? "Modèle d'email dupliqué avec succès" : "Modèle d'email créé avec succès");
      }
      
      if (onSuccess) onSuccess();
      if (mode === "create") form.reset();
    } catch (error: any) {
      console.error("Erreur lors de l'opération:", error);
      toast.error("Erreur lors de l'opération");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getButtonText = () => {
    switch (mode) {
      case "edit": return isSubmitting ? "Modification..." : "Modifier le modèle";
      case "duplicate": return isSubmitting ? "Duplication..." : "Dupliquer le modèle";
      default: return isSubmitting ? "Création..." : "Créer le modèle";
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type du modèle</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Ex: booking_confirmation, welcome_email..." 
                  {...field} 
                  disabled={mode === "edit"} // Le type ne peut pas être modifié en édition
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom du modèle</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Newsletter mensuelle" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="subject"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sujet</FormLabel>
              <FormControl>
                <Input placeholder="Sujet de l'email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contenu HTML</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="<h1>Titre</h1><p>Contenu de l'email...</p>"
                  className="min-h-[200px] font-mono"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-2">
          <Button type="submit" disabled={isSubmitting}>
            {getButtonText()}
          </Button>
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Annuler
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
};
