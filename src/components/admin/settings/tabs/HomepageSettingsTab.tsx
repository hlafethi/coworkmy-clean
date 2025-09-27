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
import { ImageUploader } from "@/components/admin/ImageUploader";
import { UseFormReturn, ControllerRenderProps } from "react-hook-form";
import { SettingsFormValues } from "@/types/settings";
import { useId } from "react";

interface HomepageSettingsTabProps {
  form: UseFormReturn<SettingsFormValues>;
  isDisabled?: boolean;
}

export function HomepageSettingsTab({ form, isDisabled }: HomepageSettingsTabProps) {
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
