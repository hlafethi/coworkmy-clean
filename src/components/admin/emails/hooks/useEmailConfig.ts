import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const emailConfigSchema = z.object({
  host: z.string().min(1, "Le serveur SMTP est requis"),
  port: z.coerce.number().int().min(1, "Le port est requis"),
  username: z.string().min(1, "Le nom d'utilisateur est requis"),
  password: z.string().min(1, "Le mot de passe est requis"),
  from_email: z.string().email("Format d'email invalide"),
});

export type EmailConfigFormValues = z.infer<typeof emailConfigSchema>;

export const useEmailConfig = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [configExists, setConfigExists] = useState(false);
  const [configId, setConfigId] = useState<string | null>(null);

  // Valeurs par défaut pour éviter le warning undefined -> defined
  const defaultValues: EmailConfigFormValues = {
    host: "",
    port: 587,
    username: "",
    password: "",
    from_email: "",
  };

  const form = useForm<EmailConfigFormValues>({
    resolver: zodResolver(emailConfigSchema),
    defaultValues, // Utilisation des valeurs par défaut définies
    mode: "onChange" // Évite les re-renders inutiles
  });

  const fetchConfig = async () => {
    setIsLoading(true);
    try {
      console.log('🔄 Chargement de la configuration email...');
      
      const { data, error } = await supabase
        .from("email_config")
        .select("*")
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("❌ Erreur lors de la récupération de la configuration:", error);
        // En cas d'erreur, garder les valeurs par défaut
        form.reset(defaultValues);
        return;
      }

      if (data) {
        console.log('✅ Configuration trouvée:', data.id);
        setConfigExists(true);
        setConfigId(data.id);
        
        // Mapper les colonnes de la DB vers les champs du formulaire
        const formValues: EmailConfigFormValues = {
          host: data.smtp_host || "",
          port: data.smtp_port || 587,
          username: data.smtp_username || "",
          password: data.smtp_password || "",
          from_email: data.from_email || "",
        };
        
        form.reset(formValues);
      } else {
        console.log('ℹ️ Aucune configuration trouvée, utilisation des valeurs par défaut');
        setConfigExists(false);
        setConfigId(null);
        form.reset(defaultValues);
      }
    } catch (error) {
      console.error("❌ Erreur lors de la récupération de la configuration:", error);
      form.reset(defaultValues);
    } finally {
      setIsLoading(false);
    }
  };

  const saveConfig = async (values: EmailConfigFormValues) => {
    setIsSubmitting(true);
    try {
      console.log('💾 Sauvegarde de la configuration...');
      
      // Mapper les champs du formulaire vers les colonnes de la DB
      const configData = {
        smtp_host: values.host,
        smtp_port: values.port,
        smtp_username: values.username,
        smtp_password: values.password,
        from_email: values.from_email,
        smtp_secure: true, // Valeur par défaut
        from_name: "Application Coworking", // Valeur par défaut
        is_active: true
      };

      let error;
      if (configExists && configId) {
        console.log('🔄 Mise à jour de la configuration existante...');
        const response = await supabase
          .from("email_config")
          .update(configData)
          .eq("id", configId);
        error = response.error;
      } else {
        console.log('➕ Création d\'une nouvelle configuration...');
        const response = await supabase
          .from("email_config")
          .insert([configData])
          .select()
          .single();
        
        error = response.error;
        
        if (!error && response.data) {
          setConfigId(response.data.id);
          setConfigExists(true);
        }
      }

      if (error) throw error;
      
      console.log('✅ Configuration sauvegardée avec succès');
      toast.success("Configuration email enregistrée avec succès");
      
    } catch (error: any) {
      console.error("❌ Erreur lors de l'enregistrement de la configuration:", error);
      toast.error(`Erreur: ${error.message || "Erreur lors de l'enregistrement"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  return {
    form,
    isLoading,
    isSubmitting,
    configExists,
    saveConfig,
  };
};
