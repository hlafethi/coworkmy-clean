import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { UseFormReturn, useWatch } from "react-hook-form";
import { SpaceFormValues } from "../types";
import { ImageUpload } from "./ImageUpload";
import { useImageUpload } from "../hooks/useImageUpload";
import { useState } from "react";

interface BasicInfoProps {
  form: UseFormReturn<SpaceFormValues>;
}

export const BasicInfo = ({ form }: BasicInfoProps) => {
  const { control, setValue, trigger } = form;
  const [isUploading, setIsUploading] = useState(false);
  const { imagePreview, handleImageChange, uploadImage } = useImageUpload();
  
  // Surveiller la valeur actuelle de image_url
  const currentImageUrl = useWatch({
    control,
    name: "image_url"
  });

  // Fonction pour gérer le changement d'image et l'upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Créer un aperçu immédiat
    handleImageChange(e);
    setIsUploading(true);

    try {
      // Upload de l'image
      const imageUrl = await uploadImage(file);
      
      // Mettre à jour le champ image_url dans le formulaire
      setValue('image_url', imageUrl);
      
      // Déclencher la validation du formulaire
      trigger('image_url');
    } catch (error) {
      console.error('Erreur lors de l\'upload de l\'image:', error);
    } finally {
      setIsUploading(false);
    }
  };

  // Fonction pour effacer l'image
  const handleClearImage = () => {
    setValue('image_url', '');
    trigger('image_url');
  };

  return (
    <>
      <FormField
        control={control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nom de l'espace</FormLabel>
            <FormControl>
              <Input placeholder="Salle de réunion 1" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Description de l'espace..."
                {...field}
                value={field.value || ""}
                onChange={(e) => {
                  const value = e.target.value;
                  field.onChange(value);
                  
                  // Validation : si l'utilisateur tape quelque chose puis efface tout, 
                  // on considère que c'est une description vide valide
                  if (value.trim() === "" && value !== "") {
                    // L'utilisateur a tapé des espaces uniquement
                    field.onChange(""); // Normaliser en chaîne vide
                  }
                }}
              />
            </FormControl>
            <FormMessage />
            <p className="text-sm text-muted-foreground">
              Laissez vide si vous n'avez pas de description spécifique.
            </p>
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="image_url"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Image de l'espace</FormLabel>
            <FormControl>
              <ImageUpload 
                onImageChange={handleImageUpload}
                imagePreview={imagePreview || currentImageUrl}
                isUploading={isUploading}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
};
