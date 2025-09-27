import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, Shield, Calculator } from 'lucide-react';

interface StripeTaxInfoProps {
  showInfo?: boolean;
  className?: string;
}

/**
 * Composant d'information sur les taxes Stripe
 * Affiche des informations utiles sur le calcul automatique des taxes
 */
export const StripeTaxInfo: React.FC<StripeTaxInfoProps> = ({ 
  showInfo = true, 
  className = '' 
}) => {
  if (!showInfo) return null;

  return (
    <Alert className={`border-blue-200 bg-blue-50 ${className}`}>
      <Calculator className="h-4 w-4 text-blue-600" />
      <AlertDescription className="text-blue-800">
        <strong>Calcul automatique des taxes :</strong> Les taxes sont calculées automatiquement 
        selon votre localisation et les réglementations fiscales en vigueur. 
        Aucune action supplémentaire n'est requise de votre part.
      </AlertDescription>
    </Alert>
  );
};

/**
 * Composant d'alerte pour les erreurs de taxes
 */
export const StripeTaxError: React.FC<{ error: string }> = ({ error }) => {
  return (
    <Alert className="border-red-200 bg-red-50">
      <Info className="h-4 w-4 text-red-600" />
      <AlertDescription className="text-red-800">
        <strong>Erreur de calcul des taxes :</strong> {error}
      </AlertDescription>
    </Alert>
  );
};

/**
 * Composant d'information sur la conformité fiscale
 */
export const TaxComplianceInfo: React.FC = () => {
  return (
    <Alert className="border-green-200 bg-green-50">
      <Shield className="h-4 w-4 text-green-600" />
      <AlertDescription className="text-green-800">
        <strong>Conformité fiscale :</strong> Toutes les transactions respectent 
        les réglementations fiscales européennes et françaises. 
        Les factures incluent automatiquement les informations requises.
      </AlertDescription>
    </Alert>
  );
}; 