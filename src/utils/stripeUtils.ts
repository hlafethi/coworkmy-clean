import { withRetry } from "./supabaseUtils";
import { supabase } from "@/integrations/supabase/client";
import { loadStripe } from "@stripe/stripe-js";

/**
 * Crée une session de paiement Stripe et retourne l'URL de redirection
 * @param bookingId ID de la réservation
 * @param amount Montant du paiement en centimes
 * @param currency Devise (par défaut EUR)
 * @param customerEmail Email du client
 * @param metadata Métadonnées supplémentaires
 * @param isAdmin Si l'utilisateur est admin (optionnel)
 * @returns URL de redirection vers la page de paiement Stripe
 */
// Récupérer la clé publique Stripe depuis les variables d'environnement
const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

export const createStripeCheckoutSession = async (
  bookingId: string,
  amount: number,
  customerEmail: string,
  metadata: Record<string, string> = {},
  currency: string = 'eur',
  isAdmin: boolean = false
): Promise<{ url: string, mode: string }> => {
  try {
    // Vérifier que la clé publique Stripe est définie
    if (!STRIPE_PUBLISHABLE_KEY) {
      console.warn("Clé publique Stripe non définie dans les variables d'environnement");
      throw new Error("Configuration Stripe incomplète");
    }

    // LOG: Afficher les paramètres envoyés
    console.log("[Stripe] Appel create-payment-session avec :", {
      bookingId, amount, customerEmail, metadata, currency
    });

    // LOG: Afficher l'URL utilisée
    const edgeUrl = import.meta.env.PROD
      ? '/functions/v1/create-payment-session'
      : 'https://exffryodynkyizbeesbt.functions.supabase.co/create-payment-session';
    console.log("[Stripe] URL Edge utilisée :", edgeUrl);

    // Appeler la fonction serverless Supabase pour créer une session de paiement Stripe
    const response = await fetch(edgeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        bookingId,
        amount,
        customerEmail,
        metadata,
        currency,
        isAdmin,
      }),
    });

    // LOG: Afficher le statut de la réponse
    console.log("[Stripe] Statut HTTP de la réponse :", response.status);

    // LOG: Afficher les headers de la réponse
    console.log("[Stripe] Headers de la réponse :", Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorData = await response.json();
      console.error("[Stripe] Erreur lors de la création de la session :", errorData);
      throw new Error(errorData.error || "Erreur lors de la création de la session de paiement");
    }

    const data = await response.json();
    console.log("[Stripe] Réponse JSON reçue :", data);
    const { url, mode } = data;
    
    if (!url) {
      console.error("[Stripe] URL de redirection Stripe non trouvée dans la réponse !", data);
      throw new Error("URL de redirection Stripe non trouvée");
    }
    
    return { url, mode };
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
    
    // 2. Si pas de token dans localStorage, essayer getSession avec timeout
    if (!accessToken) {
      try {
        console.log('[Stripe] Tentative de récupération du token via getSession...');
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout getSession')), 3000)
        );
        
        const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]) as any;
        
        if (session) {
          accessToken = session.access_token;
          console.log('[Stripe] Token récupéré via getSession');
        }
      } catch (error) {
        console.warn('[Stripe] Erreur lors de la récupération du token via getSession:', error);
      }
    }

    if (!accessToken) {
      throw new Error('Utilisateur non authentifié - aucun token trouvé');
    }

    console.log('[Stripe] Token d\'authentification récupéré avec succès');

    // Utiliser la fonction Edge Supabase avec authentification
    const edgeUrl = import.meta.env.PROD
      ? '/functions/v1/create-customer-portal'
      : 'https://exffryodynkyizbeesbt.functions.supabase.co/create-customer-portal';
    
    console.log('[Stripe] URL Edge utilisée :', edgeUrl);

    // S'assurer que les données sont bien sérialisées
    const requestBody = {
      customerEmail,
      returnUrl,
      isAdmin
    };

    console.log('[Stripe] Données envoyées:', JSON.stringify(requestBody));

    const response = await fetch(edgeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(requestBody),
    });

    console.log('[Stripe] Statut HTTP de la réponse :', response.status);
    console.log('[Stripe] Headers de la réponse :', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      let errorMessage = 'Erreur lors de la création du portail client';
      
      try {
        const errorText = await response.text();
        console.log('[Stripe] Réponse d\'erreur brute :', errorText);
        
        // Essayer de parser comme JSON
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorData.message || errorMessage;
          if (errorData.details) {
            errorMessage += ` - ${errorData.details}`;
          }
        } catch (parseError) {
          // Si ce n'est pas du JSON, utiliser le texte brut
          errorMessage = errorText || errorMessage;
        }
      } catch (textError) {
        console.error('[Stripe] Erreur lors de la lecture de la réponse d\'erreur:', textError);
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('[Stripe] Portail client créé avec succès :', data);
    return data;

  } catch (error) {
    console.error('[Stripe] Erreur dans createStripeCustomerPortal:', error);
    throw error;
  }
};

/**
 * Vérifie le statut d'un paiement
 * @param paymentId ID du paiement
 * @returns Statut du paiement
 */
export const checkPaymentStatus = async (paymentId: string): Promise<string> => {
  try {
    const { data, error } = await withRetry(async () => {
      return await supabase
        .from('payments')
        .select('status')
        .eq('id', paymentId)
        .single();
    });
    
    if (error) throw error;
    
    return data.status;
  } catch (error) {
    console.error("Erreur lors de la vérification du statut du paiement:", error);
    throw error;
  }
};

/**
 * Met à jour le statut d'un paiement
 * @param paymentId ID du paiement
 * @param status Nouveau statut
 */
export const updatePaymentStatus = async (paymentId: string, status: string): Promise<void> => {
  try {
    const { error } = await withRetry(async () => {
      return await supabase
        .from('payments')
        .update({ 
          status: status,
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentId);
    });
    
    if (error) throw error;
  } catch (error) {
    console.error("Erreur lors de la mise à jour du statut du paiement:", error);
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
    const { error } = await withRetry(async () => {
      return await supabase
        .from('bookings')
        .update({ status: status })
        .eq('id', bookingId);
    });
    
    if (error) throw error;
  } catch (error) {
    console.error("Erreur lors de la mise à jour du statut de la réservation:", error);
    throw error;
  }
};
