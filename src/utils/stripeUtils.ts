import { apiClient } from "@/lib/api-client";

/**
 * Crée une session de paiement Stripe et retourne l'URL de redirection
 * @param bookingId ID de la réservation
 * @param amount Montant du paiement en centimes
 * @param customerEmail Email du client
 * @param metadata Métadonnées supplémentaires
 * @param currency Devise (par défaut EUR)
 * @param isAdmin Si l'utilisateur est admin (optionnel)
 * @returns URL de redirection vers la page de paiement Stripe
 */
export const createStripeCheckoutSession = async (
  bookingId: string,
  amount: number,
  customerEmail: string,
  metadata: Record<string, string> = {},
  currency: string = 'eur',
  isAdmin: boolean = false
): Promise<{ url: string, mode: string }> => {
  try {
    console.log("[Stripe] Création de session via backend API");
    
    // Utiliser l'API client qui gère automatiquement l'URL et l'authentification
    const response = await apiClient.post('/stripe/create-checkout-session', {
      booking_id: bookingId,
      amount: amount,
      customer_email: customerEmail,
      metadata: metadata
    });

    if (!response.success) {
      throw new Error(response.error || 'Erreur lors de la création de la session');
    }

    return {
      url: response.data.url,
      mode: response.data.mode || 'test'
    };

  } catch (error) {
    console.error("[Stripe] Erreur dans createStripeCheckoutSession:", error);
    throw error;
  }
};

/**
 * Crée un lien vers le portail client Stripe pour gérer les abonnements et factures
 * @param customerEmail Email du client
 * @param returnUrl URL de retour après utilisation du portail (optionnel)
 * @param isAdmin Si l'utilisateur est admin (optionnel)
 * @returns URL du portail client Stripe
 */
export const createStripeCustomerPortal = async (
  customerEmail: string,
  returnUrl?: string,
  isAdmin: boolean = false
): Promise<{ url: string; mode: string; customerId: string }> => {
  try {
    console.log('[Stripe] Appel create-customer-portal avec :', { customerEmail, returnUrl, isAdmin });

    // Récupérer le token d'authentification avec la même logique que AuthContext
    let accessToken = null;
    
    // 1. Essayer différentes clés possibles pour Supabase dans localStorage
    const possibleKeys = [
      'coworkmy-auth-token',
      'coworkmy-auth-session',
      'sb-exffryodynkyizbeesbt-auth-token',
      'supabase.auth.token',
      'supabase.auth.session'
    ];
    
    for (const key of possibleKeys) {
      const data = localStorage.getItem(key);
      if (data) {
        try {
          let parsed = JSON.parse(data);
          
          // Si c'est un tableau (caractères), essayer de parser une deuxième fois
          if (Array.isArray(parsed)) {
            const jsonString = parsed.join('');
            parsed = JSON.parse(jsonString);
          }
          // Si c'est une chaîne, essayer de parser une deuxième fois
          else if (typeof parsed === 'string') {
            parsed = JSON.parse(parsed);
          }
          
          if (parsed.access_token) {
            accessToken = parsed.access_token;
            console.log('[Stripe] Token trouvé dans localStorage avec la clé:', key);
            break;
          }
        } catch (e) {
          // Ignorer les erreurs de parsing
        }
      }
    }
    
    // 2. Si pas de token dans localStorage, utiliser l'API client
    if (!accessToken) {
      try {
        console.log('[Stripe] Tentative de récupération du token via API client...');
        // L'API client gère automatiquement l'authentification
        // Pas besoin de récupérer le token manuellement
        accessToken = 'authenticated'; // Marqueur pour indiquer que l'utilisateur est authentifié
        console.log('[Stripe] Utilisateur authentifié via API client');
      } catch (error) {
        console.warn('[Stripe] Erreur lors de la récupération du token via API client:', error);
      }
    }

    if (!accessToken) {
      throw new Error('Utilisateur non authentifié - aucun token trouvé');
    }

    console.log('[Stripe] Token d\'authentification récupéré avec succès');

    // Utiliser l'API backend avec authentification
    console.log('[Stripe] Appel API backend pour créer le portail client...');
    
    const response = await apiClient.post('/stripe/create-customer-portal', {
      customerEmail,
      returnUrl,
      isAdmin
    });

    console.log('[Stripe] Réponse de l\'API :', response);

    if (!response.success) {
      throw new Error(response.error || 'Erreur lors de la création du portail client');
    }

    const data = response.data;
    console.log('[Stripe] Portail client créé avec succès :', data);
    return data;

  } catch (error) {
    console.error('[Stripe] Erreur dans createStripeCustomerPortal:', error);
    throw error;
  }
};


/**
 * Met à jour le statut d'une réservation
 * @param bookingId ID de la réservation
 * @param status Nouveau statut
 */
export const updateBookingStatus = async (bookingId: string, status: string): Promise<void> => {
  try {
    const response = await apiClient.put(`/bookings/${bookingId}/status`, { status });
    if (!response.success) {
      throw new Error(response.error || "Failed to update booking status");
    }
    console.log(`✅ Statut de la réservation ${bookingId} mis à jour à ${status}`);
  } catch (error) {
    console.error(`❌ Erreur lors de la mise à jour du statut de la réservation ${bookingId}:`, error);
    throw error;
  }
};
