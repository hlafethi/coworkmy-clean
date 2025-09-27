import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

const PaymentCancel = () => {
  const navigate = useNavigate();

  useEffect(() => {
    toast.error("Le paiement a été annulé");
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-6 w-6" />
            Paiement annulé
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            Votre paiement a été annulé. Vous pouvez réessayer ou retourner au tableau de bord.
          </p>
          <div className="flex gap-4">
            <Button onClick={() => navigate(-1)}>
              Réessayer
            </Button>
            <Button variant="outline" onClick={() => navigate("/dashboard")}>
              Retour au tableau de bord
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentCancel;
