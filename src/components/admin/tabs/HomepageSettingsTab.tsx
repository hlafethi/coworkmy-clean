import { UseFormReturn } from "react-hook-form"
import { SettingsFormValues } from "@/types/settings"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { ImageUploader } from "@/components/admin/ImageUploader"

export function HomepageSettingsTab({
    form,
    isSaving,
    isDisabled
}: {
    form: UseFormReturn<SettingsFormValues>
    isSaving: boolean
    isDisabled: boolean
}) {
    return (
        <div className="space-y-6">
            {/* ───── Hero Section ───── */}
            <FormField
                control={form.control}
                name="homepage.hero_title"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Titre principal</FormLabel>
                        <FormControl>
                            <Input {...field} value={field.value || ''} disabled={isDisabled || isSaving} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <FormField
                control={form.control}
                name="homepage.hero_subtitle"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Sous-titre</FormLabel>
                        <FormControl>
                            <Textarea
                                value={field.value || ''}
                                onChange={field.onChange}
                                disabled={isDisabled || isSaving}
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <FormField
                control={form.control}
                name="homepage.hero_background_image"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Image de fond</FormLabel>
                        <FormControl>
                            <ImageUploader
                                id="hero-background-image"
                                value={field.value || ''}
                                onChange={(url: string) => field.onChange(url)}
                                disabled={isDisabled || isSaving}
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />

            {/* ───── Features Section ───── */}
            <FormField
                control={form.control}
                name="homepage.features_title"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Titre des fonctionnalités</FormLabel>
                        <FormControl>
                            <Input {...field} value={field.value || ''} disabled={isDisabled || isSaving} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <FormField
                control={form.control}
                name="homepage.features_subtitle"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Sous-titre des fonctionnalités</FormLabel>
                        <FormControl>
                            <Textarea
                                value={field.value || ''}
                                onChange={field.onChange}
                                disabled={isDisabled || isSaving}
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />

            {/* ───── CTA Section ───── */}
            <FormField
                control={form.control}
                name="homepage.cta_text"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Texte du CTA</FormLabel>
                        <FormControl>
                            <Input {...field} value={field.value || ''} disabled={isDisabled || isSaving} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <FormField
                control={form.control}
                name="homepage.cta_section_title"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Titre de la section CTA</FormLabel>
                        <FormControl>
                            <Input {...field} value={field.value || ''} disabled={isDisabled || isSaving} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <FormField
                control={form.control}
                name="homepage.cta_section_subtitle"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Sous-titre de la section CTA</FormLabel>
                        <FormControl>
                            <Textarea
                                value={field.value || ''}
                                onChange={field.onChange}
                                disabled={isDisabled || isSaving}
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <FormField
                control={form.control}
                name="homepage.cta_secondary_button_text"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Texte du bouton secondaire</FormLabel>
                        <FormControl>
                            <Input {...field} value={field.value || ''} disabled={isDisabled || isSaving} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />

            {/* ───── Publication ───── */}
            <FormField
                control={form.control}
                name="homepage.is_published"
                render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <FormLabel className="text-base">Publication</FormLabel>
                            <p className="text-sm text-muted-foreground">
                                Rendre la page visible publiquement
                            </p>
                        </div>
                        <FormControl>
                            <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                disabled={isDisabled || isSaving}
                            />
                        </FormControl>
                    </FormItem>
                )}
            />
        </div>
    )
} 