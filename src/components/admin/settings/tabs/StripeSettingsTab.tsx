import {
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import type { SettingsFormValues } from "@/types/settings";

interface StripeSettingsTabProps {
    form: UseFormReturn<SettingsFormValues>;
    isDisabled?: boolean;
}

export function StripeSettingsTab({ form, isDisabled }: StripeSettingsTabProps) {
    return (
        <div>
            <div>
                <h3 className="text-lg font-medium">Configuration Stripe</h3>
                <p className="text-sm text-muted-foreground">
                    Configurez les clés API Stripe pour gérer les paiements.
                </p>
            </div>

            <div className="space-y-6 mt-4">
                <div className="space-y-4">
                    <h4 className="text-sm font-medium">Mode Test</h4>

                    <FormField
                        control={form.control}
                        name="stripe.test_publishable_key"
                        render={({ field }) => {
                            const id = "stripe_test_publishable_key";
                            return (
                                <FormItem>
                                    <FormLabel htmlFor={id}>Clé publique de test</FormLabel>
                                    <FormControl>
                                        <Input
                                            id={id}
                                            {...field}
                                            value={field.value ?? ""}
                                            type="password"
                                            disabled={isDisabled}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        Clé publique Stripe pour l'environnement de test.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            );
                        }}
                    />

                    <FormField
                        control={form.control}
                        name="stripe.test_secret_key"
                        render={({ field }) => {
                            const id = "stripe_test_secret_key";
                            return (
                                <FormItem>
                                    <FormLabel htmlFor={id}>Clé secrète de test</FormLabel>
                                    <FormControl>
                                        <Input
                                            id={id}
                                            {...field}
                                            value={field.value ?? ""}
                                            type="password"
                                            disabled={isDisabled}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        Clé secrète Stripe pour l'environnement de test.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            );
                        }}
                    />

                    <FormField
                        control={form.control}
                        name="stripe.webhook_secret"
                        render={({ field }) => {
                            const id = "stripe_webhook_secret";
                            return (
                                <FormItem>
                                    <FormLabel htmlFor={id}>Secret webhook de test</FormLabel>
                                    <FormControl>
                                        <Input
                                            id={id}
                                            {...field}
                                            value={field.value ?? ""}
                                            type="password"
                                            disabled={isDisabled}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        Secret pour vérifier les webhooks Stripe en test.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            );
                        }}
                    />
                </div>

                <div className="space-y-4">
                    <h4 className="text-sm font-medium">Mode Production</h4>

                    <FormField
                        control={form.control}
                        name="stripe.live_publishable_key"
                        render={({ field }) => {
                            const id = "stripe_live_publishable_key";
                            return (
                                <FormItem>
                                    <FormLabel htmlFor={id}>Clé publique de production</FormLabel>
                                    <FormControl>
                                        <Input
                                            id={id}
                                            {...field}
                                            value={field.value ?? ""}
                                            type="password"
                                            disabled={isDisabled}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        Clé publique Stripe pour l'environnement de production.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            );
                        }}
                    />

                    <FormField
                        control={form.control}
                        name="stripe.live_secret_key"
                        render={({ field }) => {
                            const id = "stripe_live_secret_key";
                            return (
                                <FormItem>
                                    <FormLabel htmlFor={id}>Clé secrète de production</FormLabel>
                                    <FormControl>
                                        <Input
                                            id={id}
                                            {...field}
                                            value={field.value ?? ""}
                                            type="password"
                                            disabled={isDisabled}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        Clé secrète Stripe pour l'environnement de production.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            );
                        }}
                    />

                    <FormField
                        control={form.control}
                        name="stripe.live_webhook_secret"
                        render={({ field }) => {
                            const id = "stripe_live_webhook_secret";
                            return (
                                <FormItem>
                                    <FormLabel htmlFor={id}>Secret webhook de production</FormLabel>
                                    <FormControl>
                                        <Input
                                            id={id}
                                            {...field}
                                            value={field.value ?? ""}
                                            type="password"
                                            disabled={isDisabled}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        Secret pour vérifier les webhooks Stripe en production.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            );
                        }}
                    />
                </div>
            </div>
        </div>
    );
} 