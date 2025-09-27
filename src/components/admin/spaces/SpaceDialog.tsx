import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { supabaseAdmin } from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { SpaceForm } from "./SpaceForm";
import { type SpaceFormValues, type SpaceFormData } from "./types";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SpaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  space?: SpaceFormData;
  mode: "add" | "edit";
}

export const SpaceDialog = ({
  open,
  onOpenChange,
  onSuccess,
  space,
  mode,
}: SpaceDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = mode === "edit";

  // Fonction pour gérer la fermeture du dialogue
  const handleClose = () => {
    if (!isSubmitting) {
      onOpenChange(false);
    }
  };

  // Fonction pour synchroniser avec Stripe
  const syncWithStripe = async (spaceId: string) => {
    try {
      console.log("🔄 Démarrage de la synchronisation Stripe pour l'espace:", spaceId);
      
      // Utiliser le client Supabase avec la clé service_role
      const { data, error } = await supabaseAdmin.functions.invoke('stripe-sync-queue', {
        body: { 
          action: 'sync_single',
          spaceId,
          timestamp: new Date().toISOString()
        }
      });

      if (error) {
        console.error("❌ Erreur lors de la synchronisation Stripe:", error);
        throw new Error(`Erreur Stripe: ${error.message}`);
      }

      console.log("✅ Synchronisation Stripe réussie:", data);
      return data;
    } catch (error) {
      console.error("❌ Erreur lors de la synchronisation Stripe:", error);
      throw error;
    }
  };

  const handleSubmit = async (data: SpaceFormValues) => {
    try {
      setIsSubmitting(true);
      
      // Récupérer l'utilisateur connecté
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw new Error("Authentification requise");
      
      // Patch image_url : si vide et en édition, on garde l'ancienne valeur
      let imageUrlToSave = data.image_url;
      if (isEditMode && (!data.image_url || data.image_url === '')) {
        imageUrlToSave = space?.image_url || null;
      }

      // Préparer les données pour la base de données
      const operationData: any = {
        name: data.name,
        description: data.description || null,
        capacity: data.capacity,
        hourly_price: data.hourly_price,
        daily_price: data.daily_price,
        half_day_price: data.half_day_price || 0,
        quarter_price: data.quarter_price || 0,
        monthly_price: data.monthly_price || 0,
        yearly_price: data.yearly_price || 0,
        custom_price: data.custom_price || 0,
        custom_label: data.custom_label || null,
        is_active: data.is_active,
        pricing_type: data.pricing_type,
        image_url: imageUrlToSave,
        price_per_hour: data.hourly_price,
        created_by: userData.user?.id,
      };

      let result;
      let spaceId: string;
      
      if (isEditMode && space?.id) {
        // Sécurité : ne jamais envoyer de champ payload
        delete operationData.payload;
        // Mise à jour de l'espace existant
        result = await supabase
          .from("spaces")
          .update(operationData)
          .eq("id", space.id)
          .select('id')
          .single();
        spaceId = space.id;
      } else {
        // Ajout d'un nouvel espace
        result = await supabase
          .from("spaces")
          .insert(operationData)
          .select('id')
          .single();
          
        spaceId = result.data?.id!;
      }

      if (result.error) throw result.error;

      // Synchroniser avec Stripe après la création/modification
      if (spaceId) {
        try {
          console.log("🚀 Synchronisation automatique avec Stripe...");
          await syncWithStripe(spaceId);
          toast.success("Synchronisation avec Stripe réussie !");
        } catch (stripeError) {
          console.error("⚠️ Erreur lors de la synchronisation Stripe:", stripeError);
          toast.warning("Espace sauvegardé mais erreur Stripe. Vérifiez les logs.");
        }
      }
      
      toast.success(isEditMode 
        ? "Espace mis à jour avec succès" 
        : "Espace ajouté avec succès"
      );
      handleClose();
      onSuccess();
    } catch (error: any) {
      console.error("Erreur:", error);
      
      let errorMessage = isEditMode 
        ? "Impossible de mettre à jour l'espace" 
        : "Impossible d'ajouter l'espace";

      if (error?.code === '23505') {
        errorMessage = "Un espace avec ce nom existe déjà.";
      } else if (error?.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Modifier l'espace" : "Ajouter un nouvel espace"}</DialogTitle>
          <DialogDescription>
            {isEditMode 
              ? "Modifiez les informations de l'espace existant." 
              : "Remplissez le formulaire pour ajouter un nouvel espace."}
            <br />
            <span className="text-sm text-muted-foreground">
              L'espace sera automatiquement synchronisé avec le catalogue Stripe.
            </span>
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-1 overflow-y-auto pr-4">
          <SpaceForm
            defaultValues={space}
            onSubmit={handleSubmit}
            onCancel={handleClose}
            isSubmitting={isSubmitting}
          />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
