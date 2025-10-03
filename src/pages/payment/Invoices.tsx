import { StripeCustomerPortal } from "@/components/common/StripeCustomerPortal";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Download, Calendar, Shield, Receipt } from "lucide-react";

export default function Invoices() {
  console.log('🔍 Page Invoices chargée');
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mes factures</h1>
          <p className="text-gray-600">Accédez à votre portail de facturation Stripe</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Portail Stripe */}
          <StripeCustomerPortal />

          {/* Informations sur les factures */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Gestion des factures
              </CardTitle>
              <CardDescription>
                Tout ce que vous pouvez faire avec vos factures
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-sm">Consulter l'historique</p>
                    <p className="text-xs text-gray-600">Voir toutes vos factures passées</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <Download className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-sm">Télécharger les factures</p>
                    <p className="text-xs text-gray-600">Exportez vos factures en PDF</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                  <Calendar className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="font-medium text-sm">Suivi des paiements</p>
                    <p className="text-xs text-gray-600">Consultez le statut de vos paiements</p>
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