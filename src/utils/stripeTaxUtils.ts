/**
 * Utilitaires pour la gestion des taxes Stripe
 * Gère le calcul automatique des taxes et la conformité fiscale
 */

export interface StripeTaxConfig {
  enabled: boolean;
  taxBehavior?: 'exclusive' | 'inclusive' | 'unspecified';
}

export interface StripeTaxCollection {
  enabled: boolean;
}

/**
 * Configuration par défaut pour les taxes Stripe
 */
export const DEFAULT_STRIPE_TAX_CONFIG: StripeTaxConfig = {
  enabled: true,
  taxBehavior: 'exclusive'
};

/**
 * Configuration par défaut pour la collecte des informations fiscales
 */
export const DEFAULT_TAX_COLLECTION_CONFIG: StripeTaxCollection = {
  enabled: true
};

/**
 * Obtient la configuration des taxes pour une session Stripe
 * @param options Options de configuration personnalisées
 * @returns Configuration des taxes
 */
export function getStripeTaxConfig(options?: Partial<StripeTaxConfig>): StripeTaxConfig {
  return {
    ...DEFAULT_STRIPE_TAX_CONFIG,
    ...options
  };
}

/**
 * Obtient la configuration de collecte des taxes pour une session Stripe
 * @param options Options de configuration personnalisées
 * @returns Configuration de collecte des taxes
 */
export function getTaxCollectionConfig(options?: Partial<StripeTaxCollection>): StripeTaxCollection {
  return {
    ...DEFAULT_TAX_COLLECTION_CONFIG,
    ...options
  };
}

/**
 * Vérifie si les taxes Stripe sont activées dans l'environnement
 * @returns true si les taxes sont activées
 */
export function isStripeTaxEnabled(): boolean {
  // En production, toujours activer les taxes
  if (process.env.NODE_ENV === 'production') {
    return true;
  }
  
  // En développement, vérifier la variable d'environnement
  return process.env.REACT_APP_STRIPE_TAX_ENABLED === 'true';
}

/**
 * Log les informations de taxes pour le debugging
 * @param sessionId ID de la session Stripe
 * @param taxConfig Configuration des taxes utilisée
 */
export function logTaxInfo(sessionId: string, taxConfig: StripeTaxConfig): void {
  console.log(`[Stripe Tax] Session ${sessionId}:`, {
    enabled: taxConfig.enabled,
    taxBehavior: taxConfig.taxBehavior,
    environment: process.env.NODE_ENV
  });
}

/**
 * Gère les erreurs liées aux taxes Stripe
 * @param error Erreur Stripe
 * @returns Message d'erreur formaté
 */
export function handleStripeTaxError(error: any): string {
  if (error?.code === 'tax_calculation_failed') {
    return 'Le calcul des taxes a échoué. Veuillez vérifier l\'adresse de facturation.';
  }
  
  if (error?.code === 'tax_id_invalid') {
    return 'Le numéro de TVA fourni est invalide.';
  }
  
  if (error?.code === 'tax_rate_not_found') {
    return 'Le taux de taxe pour cette région n\'est pas disponible.';
  }
  
  return 'Une erreur est survenue lors du calcul des taxes.';
} 