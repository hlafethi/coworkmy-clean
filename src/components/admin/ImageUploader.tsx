import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { UseFormReturn, ControllerRenderProps } from "react-hook-form";
import { SettingsFormValues } from "@/types/settings";
import { useId } from "react";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface HomepageSettingsTabProps {
  form: UseFormReturn<SettingsFormValues>;
  isDisabled?: boolean;
}

export function HomepageSettingsTab({ form, isDisabled }: HomepageSettingsTabProps) {
  // Génération d'ids uniques pour chaque champ
  const titleId = useId();
  const descriptionId = useId();
  const heroTitleId = useId();
  const heroSubtitleId = useId();
  const heroBackgroundImageId = useId();
  const ctaTextId = useId();
  const featuresTitleId = useId();
  const featuresSubtitleId = useId();
  const ctaSectionTitleId = useId();
  const ctaSectionSubtitleId = useId();
  const ctaSecondaryButtonTextId = useId();
  const isPublishedId = useId();

  return (
    <div>
      <div>
        <h3 className="text-lg font-medium">Page d'accueil</h3>
        <p className="text-sm text-muted-foreground">
          Personnalisez le contenu de la page d'accueil.
        </p>
      </div>

      <div className="space-y-6">
        <FormField
          control={form.control}
          name="homepage.title"
          render={({ field }: { field: ControllerRenderProps<SettingsFormValues, "homepage.title"> }) => (
            <FormItem>
              <FormLabel htmlFor={titleId}>Titre de la page</FormLabel>
              <FormControl>
                <Input
                  id={titleId}
                  {...field}
                  autoComplete="off"
                  value={field.value ?? ""}
                  disabled={isDisabled}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="homepage.description"
          render={({ field }: { field: ControllerRenderProps<SettingsFormValues, "homepage.description"> }) => (
            <FormItem>
              <FormLabel htmlFor={descriptionId}>Description</FormLabel>
              <FormControl>
                <Textarea
                  id={descriptionId}
                  {...field}
                  autoComplete="off"
                  value={field.value ?? ""}
                  disabled={isDisabled}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="homepage.hero_title"
          render={({ field }: { field: ControllerRenderProps<SettingsFormValues, "homepage.hero_title"> }) => (
            <FormItem>
              <FormLabel htmlFor={heroTitleId}>Titre principal</FormLabel>
              <FormControl>
                <Input
                  id={heroTitleId}
                  {...field}
                  autoComplete="off"
                  value={field.value ?? ""}
                  disabled={isDisabled}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="homepage.hero_subtitle"
          render={({ field }: { field: ControllerRenderProps<SettingsFormValues, "homepage.hero_subtitle"> }) => (
            <FormItem>
              <FormLabel htmlFor={heroSubtitleId}>Sous-titre principal</FormLabel>
              <FormControl>
                <Textarea
                  id={heroSubtitleId}
                  {...field}
                  autoComplete="off"
                  value={field.value ?? ""}
                  disabled={isDisabled}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="homepage.hero_background_image"
          render={({ field }: { field: ControllerRenderProps<SettingsFormValues, "homepage.hero_background_image"> }) => (
            <FormItem>
              <FormLabel htmlFor={heroBackgroundImageId}>Image d'arrière-plan</FormLabel>
              <FormControl>
                <ImageUploader
                  id={heroBackgroundImageId}
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  label=""
                  disabled={isDisabled}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="homepage.cta_text"
          render={({ field }: { field: ControllerRenderProps<SettingsFormValues, "homepage.cta_text"> }) => (
            <FormItem>
              <FormLabel htmlFor={ctaTextId}>Texte du CTA</FormLabel>
              <FormControl>
                <Input
                  id={ctaTextId}
                  {...field}
                  autoComplete="off"
                  value={field.value ?? ""}
                  disabled={isDisabled}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="homepage.features_title"
          render={({ field }: { field: ControllerRenderProps<SettingsFormValues, "homepage.features_title"> }) => (
            <FormItem>
              <FormLabel htmlFor={featuresTitleId}>Titre des fonctionnalités</FormLabel>
              <FormControl>
                <Input
                  id={featuresTitleId}
                  {...field}
                  autoComplete="off"
                  value={field.value ?? ""}
                  disabled={isDisabled}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="homepage.features_subtitle"
          render={({ field }: { field: ControllerRenderProps<SettingsFormValues, "homepage.features_subtitle"> }) => (
            <FormItem>
              <FormLabel htmlFor={featuresSubtitleId}>Sous-titre des fonctionnalités</FormLabel>
              <FormControl>
                <Textarea
                  id={featuresSubtitleId}
                  {...field}
                  autoComplete="off"
                  value={field.value ?? ""}
                  disabled={isDisabled}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="homepage.cta_section_title"
          render={({ field }: { field: ControllerRenderProps<SettingsFormValues, "homepage.cta_section_title"> }) => (
            <FormItem>
              <FormLabel htmlFor={ctaSectionTitleId}>Titre de la section CTA</FormLabel>
              <FormControl>
                <Input
                  id={ctaSectionTitleId}
                  {...field}
                  autoComplete="off"
                  value={field.value ?? ""}
                  disabled={isDisabled}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="homepage.cta_section_subtitle"
          render={({ field }: { field: ControllerRenderProps<SettingsFormValues, "homepage.cta_section_subtitle"> }) => (
            <FormItem>
              <FormLabel htmlFor={ctaSectionSubtitleId}>Sous-titre de la section CTA</FormLabel>
              <FormControl>
                <Textarea
                  id={ctaSectionSubtitleId}
                  {...field}
                  autoComplete="off"
                  value={field.value ?? ""}
                  disabled={isDisabled}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="homepage.cta_secondary_button_text"
          render={({ field }: { field: ControllerRenderProps<SettingsFormValues, "homepage.cta_secondary_button_text"> }) => (
            <FormItem>
              <FormLabel htmlFor={ctaSecondaryButtonTextId}>Texte du bouton secondaire</FormLabel>
              <FormControl>
                <Input
                  id={ctaSecondaryButtonTextId}
                  {...field}
                  autoComplete="off"
                  value={field.value ?? ""}
                  disabled={isDisabled}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="homepage.is_published"
          render={({ field }: { field: ControllerRenderProps<SettingsFormValues, "homepage.is_published"> }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel htmlFor={isPublishedId} className="text-base">
                  Publication
                </FormLabel>
                <FormDescription>
                  Publier les modifications sur la page d'accueil
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  id={isPublishedId}
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isDisabled}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}

export function ImageUploader(props: {
  id: string;
  value: string;
  onChange: (url: string) => void;
  label?: string;
  disabled?: boolean;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string>(props.value || "");

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("L'image ne doit pas dépasser 5MB");
      return;
    }
    setIsUploading(true);
    try {
      // Générer un nom unique
      const ext = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`;
      const filePath = `homepage/${fileName}`;
      // Upload vers le bucket 'homepage'
      const { error: uploadError } = await supabase.storage
        .from('homepage')
        .upload(filePath, file);
      if (uploadError) throw uploadError;
      // Récupérer l'URL publique
      const { data } = supabase.storage
        .from('homepage')
        .getPublicUrl(filePath);
      if (!data?.publicUrl) throw new Error("Impossible d'obtenir l'URL publique");
      setPreview(data.publicUrl);
      props.onChange(data.publicUrl);
      toast.success("Image uploadée avec succès");
    } catch (error) {
      console.error('Erreur upload image:', error);
      toast.error("Erreur lors de l'upload de l'image");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div>
      <input
        id={props.id}
        type="file"
        accept="image/*"
        disabled={props.disabled || isUploading}
        onChange={handleFileChange}
      />
      {preview && (
        <img src={preview} alt="Aperçu" className="mt-2 max-h-32 rounded" />
      )}
      {isUploading && <div className="text-sm text-gray-500 mt-1">Upload en cours...</div>}
    </div>
  );
}
