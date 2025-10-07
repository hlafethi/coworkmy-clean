import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard, ExternalLink, Loader2, AlertCircle } from "lucide-react";
import { createStripeCustomerPortal } from "@/utils/stripeUtils";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContextPostgreSQL";
// Logger supprimé - utilisation de console directement
interface StripeCustomerPortalProps {
  className?: string;
  variant?: "default" | "compact";
}

export const StripeCustomerPortal = ({ className = "", variant = "default" }: StripeCustomerPortalProps) => {
  const [loading, setLoading] = useState(false);
  const [hasCustomerAccount, setHasCustomerAccount] = useState<boolean | null>(null);
  const { user, isAdmin } = useAuth();

  const handleOpenPortal = async () => {
    if (!user?.email) {
      toast.error("Email utilisateur non disponible");
      return;
    }

    try {
      setLoading(true);
      
      const returnUrl = `${window.location.origin}/dashboard`;
      const { url, mode } = await createStripeCustomerPortal(
        user.email,
        returnUrl,
        isAdmin
      );

      console.log(`[Stripe] Portail client ouvert en mode ${mode}: ${url}`);
      
      // Ouvrir le portail dans un nouvel onglet
      window.open(url, '_blank', 'noopener,noreferrer');
      
      toast.success("Portail client Stripe ouvert");
    } catch (error) {
      console.error("[Stripe] Erreur lors de l'ouverture du portail client:", error);
      
      const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
      
      if (errorMessage.includes("Aucun client Stripe trouvé")) {
        setHasCustomerAccount(false);
        toast.error("Aucun compte de paiement trouvé. Effectuez d'abord une réservation pour créer votre compte client.");
      } else {
        toast.error(`Erreur lors de l'ouverture du portail: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  if (variant === "compact") {
    return (
      <Button
        onClick={handleOpenPortal}
        disabled={loading || !user?.email}
        variant="outline"
        size="sm"
        className={`flex items-center gap-2 ${className}`}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <CreditCard className="h-4 w-4" />
        )}
        Factures & Abonnements
        <ExternalLink className="h-3 w-3" />
      </Button>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Gestion des paiements
        </CardTitle>
        <CardDescription>
          Accédez à vos factures, abonnements et informations de paiement
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium">Portail client Stripe</p>
            <p className="text-xs text-muted-foreground">
              Gérez vos paiements en toute sécurité
            </p>
          </div>
          <Badge variant="secondary">Sécurisé</Badge>
        </div>
        
        <Button
          onClick={handleOpenPortal}
          disabled={loading || !user?.email}
          className="w-full"
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Ouverture...
            </>
          ) : (
            <>
              <CreditCard className="mr-2 h-4 w-4" />
              Accéder au portail client
              <ExternalLink className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>

        {!user?.email && (
          <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-3 rounded-md">
            <AlertCircle className="h-4 w-4" />
            <span>Email utilisateur requis pour accéder au portail</span>
          </div>
        )}

        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Consultez l'historique de vos paiements</p>
          <p>• Téléchargez vos factures</p>
          <p>• Gérez vos méthodes de paiement</p>
          <p>• Annulez ou modifiez vos abonnements</p>
        </div>
      </CardContent>
    </Card>
  );
}; 