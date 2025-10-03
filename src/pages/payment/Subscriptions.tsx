import { StripeCustomerPortal } from "@/components/common/StripeCustomerPortal";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, FileText, Settings, Shield } from "lucide-react";

export default function Subscriptions() {
  console.log('🔍 Page Subscriptions chargée');
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mes abonnements</h1>
          <p className="text-gray-600">Gérez vos abonnements et méthodes de paiement</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Portail Stripe */}
          <StripeCustomerPortal />

          {/* Informations sur les abonnements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Gestion des abonnements
              </CardTitle>
              <CardDescription>
                Tout ce que vous pouvez faire dans votre portail client
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <CreditCard className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-sm">Méthodes de paiement</p>
                    <p className="text-xs text-gray-600">Ajoutez, modifiez ou supprimez vos cartes</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-sm">Historique des factures</p>
                    <p className="text-xs text-gray-600">Consultez et téléchargez vos factures</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                  <Settings className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="font-medium text-sm">Gestion des abonnements</p>
                    <p className="text-xs text-gray-600">Modifiez ou annulez vos abonnements</p>
                  </div>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Shield className="h-4 w-4" />
                  <span>Environnement sécurisé géré par Stripe</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}