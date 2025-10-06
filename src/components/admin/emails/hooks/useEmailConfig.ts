import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import { logger } from '@/utils/logger';

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
      logger.debug('🔄 Chargement de la configuration email...');
      
      const result = await apiClient.get('/email-config');

      if (!result.success) {
        logger.error("❌ Erreur lors de la récupération de la configuration:", result.message);
        // En cas d'erreur, garder les valeurs par défaut
        form.reset(defaultValues);
        return;
      }

      if (result.data) {
        logger.debug('✅ Configuration trouvée:', result.data.id);
        setConfigExists(true);
        setConfigId(result.data.id);
        
        // Mapper les colonnes de la DB vers les champs du formulaire
        const formValues: EmailConfigFormValues = {
          host: result.data.smtp_host || "",
          port: result.data.smtp_port || 587,
          username: result.data.smtp_username || "",
          password: result.data.smtp_password || "",
          from_email: result.data.from_email || "",
        };
        
        form.reset(formValues);
      } else {
        logger.debug('ℹ️ Aucune configuration trouvée, utilisation des valeurs par défaut');
        setConfigExists(false);
        setConfigId(null);
        form.reset(defaultValues);
      }
    } catch (error) {
      logger.error("❌ Erreur lors de la récupération de la configuration:", error);
      form.reset(defaultValues);
    } finally {
      setIsLoading(false);
    }
  };

  const saveConfig = async (values: EmailConfigFormValues) => {
    setIsSubmitting(true);
    try {
      logger.debug('💾 Sauvegarde de la configuration...');
      
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

      let result;
      if (configExists && configId) {
        logger.debug('🔄 Mise à jour de la configuration existante...');
        result = await apiClient.put(`/email-config/${configId}`, configData);
      } else {
        logger.debug('➕ Création d\'une nouvelle configuration...');
        result = await apiClient.post('/email-config', configData);
        
        if (result.success && result.data) {
          setConfigId(result.data.id);
          setConfigExists(true);
        }
      }

      if (!result.success) {
        throw new Error(result.message || 'Erreur lors de la sauvegarde');
      }
      
      logger.debug('✅ Configuration sauvegardée avec succès');
      toast.success("Configuration email enregistrée avec succès");
      
    } catch (error: any) {
      logger.error("❌ Erreur lors de l'enregistrement de la configuration:", error);
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
