import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { type Space } from "@/components/admin/spaces/types";

export interface TermsAndConditionsProps {
  termsAccepted: boolean;
  onTermsChange: (checked: boolean) => void;
  selectedSpace?: Space;
}

export function TermsAndConditions({
  termsAccepted,
  onTermsChange,
  selectedSpace
}: TermsAndConditionsProps) {
  // Vérifier si l'espace est un bureau individuel
  const isIndividualOffice = selectedSpace?.name?.toLowerCase().includes("bureau") || 
                            selectedSpace?.description?.toLowerCase().includes("bureau individuel");

  return (
    <div className="space-y-4 border-t pt-4 mt-4">
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="terms">
          <AccordionTrigger className="text-sm font-medium">
            Conditions générales de réservation
          </AccordionTrigger>
          <AccordionContent className="text-sm text-muted-foreground space-y-2">
            <h4 className="font-medium text-foreground">Conditions d'utilisation</h4>
            <p>En réservant un espace dans notre centre de coworking, vous acceptez les conditions suivantes :</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Respecter les autres utilisateurs et maintenir un niveau sonore raisonnable</li>
              <li>Ne pas endommager le mobilier ou les équipements mis à disposition</li>
              <li>Signaler immédiatement tout problème ou dysfonctionnement</li>
              <li>Respecter les horaires d'ouverture du centre, sauf pour les espaces avec accès 24/7</li>
              <li>Ne pas sous-louer ou prêter l'espace réservé à un tiers</li>
            </ul>

            <h4 className="font-medium text-foreground mt-3">Politique d'annulation</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>Annulation plus de 48h avant : remboursement intégral</li>
              <li>Annulation entre 24h et 48h avant : remboursement à 50%</li>
              <li>Annulation moins de 24h avant : aucun remboursement</li>
              <li>Les réservations récurrentes suivent les mêmes règles d'annulation</li>
            </ul>

            {isIndividualOffice && (
              <>
                <h4 className="font-medium text-foreground mt-3">Accès 24/7</h4>
                <p>
                  Votre réservation de bureau individuel vous donne accès aux locaux 24h/24 et 7j/7.
                  Un code d'accès personnel vous sera communiqué après confirmation de votre réservation.
                </p>
              </>
            )}

            <h4 className="font-medium text-foreground mt-3">Sécurité</h4>
            <p>
              Pour votre sécurité et celle des autres utilisateurs, nos locaux sont équipés de caméras de surveillance.
              En acceptant ces conditions, vous reconnaissez être informé de la présence de ces dispositifs et vous y consentez.
            </p>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="terms"
          checked={termsAccepted}
          onCheckedChange={(checked) => onTermsChange(checked === true)}
        />
        <Label htmlFor="terms" className="text-sm text-gray-600">
          J'accepte les conditions générales d'utilisation et la politique de confidentialité
        </Label>
      </div>
    </div>
  );
}
