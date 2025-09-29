import { useAuth } from "@/context/AuthContextPostgreSQL";
import { useToast } from "@/hooks/use-toast";
import { createStripeCheckoutSession } from "@/utils/stripeUtils";

/**
 * Hook personnalisé pour gérer les paiements Stripe
 * Récupère automatiquement le statut admin et gère les toasts
 */
export const useStripePayment = () => {
  const { isAdmin } = useAuth();
  const { toast } = useToast();

  const createPaymentSession = async (
    bookingId: string,
    amount: number,
    customerEmail: string,
    metadata: Record<string, string> = {},
    currency: string = 'eur'
  ): Promise<{ url: string, mode: string }> => {
    try {
      // Créer la session de paiement avec le statut admin
      const { url, mode } = await createStripeCheckoutSession(
        bookingId,
        amount,
        customerEmail,
        metadata,
        currency,
        isAdmin
      );

      // Afficher le toast selon le mode
      if (mode === "test") {
        toast({
          title: "Mode TEST Stripe",
          description: "Ce paiement n'est pas réel.",
          duration: 4000,
        });
      } else if (mode === "live") {
        toast({
          title: "Mode PRODUCTION Stripe",
          description: "Ce paiement est réel.",
          duration: 4000,
        });
      }

      return { url, mode };
    } catch (error) {
      console.error("Erreur lors de la création de la session de paiement:", error);
      toast({
        title: "Erreur de paiement",
        description: "Impossible de créer la session de paiement. Veuillez réessayer.",
        variant: "destructive",
        duration: 5000,
      });
      throw error;
    }
  };

  return { createPaymentSession, isAdmin };
}; 