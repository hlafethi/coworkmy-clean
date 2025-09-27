import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, CheckCircle, XCircle, ShieldCheck } from "lucide-react";

const StripeSimulator = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const amount = searchParams.get("amount") || "0";
  const currency = searchParams.get("currency") || "eur";
  const bookingId = searchParams.get("booking_id");
  const paymentId = searchParams.get("payment_id");
  const successUrl = searchParams.get("success_url");
  const cancelUrl = searchParams.get("cancel_url");

  const formattedAmount = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(parseInt(amount) / 100);

  const handlePayment = () => {
    setLoading(true);
    // Simuler un délai de traitement du paiement
    setTimeout(() => {
      if (successUrl) {
        window.location.href = decodeURIComponent(successUrl);
      } else {
        navigate(`/payment-success?booking_id=${bookingId}&payment_id=${paymentId}`);
      }
    }, 1500);
  };

  const handleCancel = () => {
    if (cancelUrl) {
      window.location.href = decodeURIComponent(cancelUrl);
    } else {
      navigate(`/payment-cancel?booking_id=${bookingId}&payment_id=${paymentId}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="h-6 w-6 text-blue-600" />
              <CardTitle className="text-2xl">Simulateur Stripe</CardTitle>
            </div>
            <div className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
              TEST
            </div>
          </div>
          <CardDescription>
            Ceci est une simulation de la page de paiement Stripe pour les tests
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Montant à payer</span>
              <span className="text-xl font-bold">{formattedAmount}</span>
            </div>
            
            <div className="pt-2 border-t">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <ShieldCheck className="h-4 w-4 text-green-600" />
                <span>Paiement sécurisé (simulation)</span>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 border rounded-lg p-4">
            <h3 className="text-sm font-medium mb-2">Informations de carte</h3>
            <div className="space-y-3">
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="flex gap-2">
                <div className="h-10 bg-gray-200 rounded flex-1"></div>
                <div className="h-10 bg-gray-200 rounded w-20"></div>
              </div>
              <div className="h-10 bg-gray-200 rounded w-1/2"></div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Pour cette simulation, aucune information de carte n'est nécessaire
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <Button 
            className="w-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-2"
            onClick={handlePayment}
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Traitement en cours...</span>
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                <span>Payer {formattedAmount}</span>
              </>
            )}
          </Button>
          <Button 
            variant="outline" 
            className="w-full flex items-center justify-center gap-2"
            onClick={handleCancel}
            disabled={loading}
          >
            <XCircle className="h-4 w-4" />
            <span>Annuler le paiement</span>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default StripeSimulator;
