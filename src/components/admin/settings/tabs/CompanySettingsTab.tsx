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
import { UseFormReturn } from "react-hook-form";
import { SettingsFormValues } from "@/types/settings";
import { ImageUploader } from "@/components/admin/ImageUploader";

interface CompanySettingsTabProps {
  form: UseFormReturn<SettingsFormValues>;
  isDisabled?: boolean;
}

export function CompanySettingsTab({ form, isDisabled }: CompanySettingsTabProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Informations de l'entreprise</h3>
        <p className="text-sm text-muted-foreground">
          Configurez les informations de votre entreprise qui apparaîtront dans le footer et sur le site.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Nom de l'entreprise */}
        <FormField
          control={form.control}
          name="company.name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom de l'entreprise</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value || ''}
                  placeholder="Votre Entreprise"
                  disabled={isDisabled}
                />
              </FormControl>
              <FormDescription>
                Le nom de votre entreprise qui apparaîtra dans le footer.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Email de contact */}
        <FormField
          control={form.control}
          name="company.email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email de contact</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value || ''}
                  placeholder="contact@votre-entreprise.com"
                  disabled={isDisabled}
                />
              </FormControl>
              <FormDescription>
                Email de contact affiché dans le footer.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Téléphone */}
        <FormField
          control={form.control}
          name="company.phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Téléphone</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value || ''}
                  placeholder="+33 1 23 45 67 89"
                  disabled={isDisabled}
                />
              </FormControl>
              <FormDescription>
                Numéro de téléphone affiché dans le footer.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Adresse */}
        <FormField
          control={form.control}
          name="company.address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Adresse</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  value={field.value || ''}
                  placeholder="123 Rue de la Paix&#10;75001 Paris, France"
                  disabled={isDisabled}
                  rows={3}
                />
              </FormControl>
              <FormDescription>
                Adresse complète de votre entreprise.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Site web */}
        <FormField
          control={form.control}
          name="company.website"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Site web</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value || ''}
                  placeholder="https://www.votre-entreprise.com"
                  disabled={isDisabled}
                />
              </FormControl>
              <FormDescription>
                URL de votre site web principal.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description de l'entreprise */}
        <FormField
          control={form.control}
          name="company.description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description de l'entreprise</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  value={field.value || ''}
                  placeholder="Une brève description de votre entreprise..."
                  disabled={isDisabled}
                  rows={4}
                />
              </FormControl>
              <FormDescription>
                Description courte de votre entreprise.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Logo de l'entreprise */}
      <div className="space-y-4">
        <h4 className="text-md font-medium">Logo de l'entreprise</h4>
        <FormField
          control={form.control}
          name="company.logo_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Logo</FormLabel>
              <FormControl>
                <ImageUploader
                  id="company-logo"
                  value={field.value || ''}
                  onChange={field.onChange}
                  label="Télécharger le logo de l'entreprise"
                  disabled={isDisabled}
                />
              </FormControl>
              <FormDescription>
                Logo de votre entreprise qui apparaîtra dans le footer et sur le site.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Informations légales */}
      <div className="space-y-4">
        <h4 className="text-md font-medium">Informations légales</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="company.siret"
            render={({ field }) => (
              <FormItem>
                <FormLabel>SIRET</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value || ''}
                    placeholder="12345678901234"
                    disabled={isDisabled}
                  />
                </FormControl>
                <FormDescription>
                  Numéro SIRET de votre entreprise.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="company.vat_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Numéro de TVA</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value || ''}
                    placeholder="FR12345678901"
                    disabled={isDisabled}
                  />
                </FormControl>
                <FormDescription>
                  Numéro de TVA intracommunautaire.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </div>
  );
}
