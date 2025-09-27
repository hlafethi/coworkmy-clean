import { supabase } from "@/integrations/supabase/client";
import Stripe from "stripe";

export interface PriceValidation {
  isValid: boolean;
  priceHT?: number;
  priceTTC?: number;
  error?: string;
}

export const validatePrice = (price: any): PriceValidation => {
  // Vérification du type et de la validité du prix
  if (typeof price !== 'number' || isNaN(price) || price <= 0) {
    return {
      isValid: false,
      error: `Prix invalide: ${price}`
    };
  }

  return {
    isValid: true,
    priceHT: price
  };
};

export const calculateTTC = (priceHT: number, tvaRate: number = 20): number => {
  return Number((priceHT * (1 + tvaRate / 100)).toFixed(2));
};

export const calculateHT = (priceTTC: number, tvaRate: number = 20): number => {
  return Number((priceTTC / (1 + tvaRate / 100)).toFixed(2));
};

export const validateSpacePrices = (space: any): PriceValidation => {
  const validHT = validatePrice(space.price_ht);
  const validTTC = validatePrice(space.price_ttc);

  if (!validHT.isValid && !validTTC.isValid) {
    return {
      isValid: false,
      error: "Aucun prix valide (HT ou TTC) trouvé pour l'espace"
    };
  }

  // Si on a un prix HT valide, on calcule le TTC
  if (validHT.isValid) {
    return {
      isValid: true,
      priceHT: validHT.priceHT,
      priceTTC: calculateTTC(validHT.priceHT!)
    };
  }

  // Si on a un prix TTC valide, on calcule le HT
  if (validTTC.isValid) {
    const priceHT = calculateHT(validTTC.priceHT!);
    return {
      isValid: true,
      priceHT,
      priceTTC: validTTC.priceHT
    };
  }

  return {
    isValid: false,
    error: "Erreur inattendue lors de la validation des prix"
  };
};

export const createStripePrice = async (
  stripe: Stripe,
  productId: string,
  price: number,
  currency: string = 'eur'
): Promise<string> => {
  try {
    // Désactiver les anciens prix
    const prices = await stripe.prices.list({ product: productId, active: true });
    for (const price of prices.data) {
      await stripe.prices.update(price.id, { active: false });
    }

    // Créer le nouveau prix
    const stripePrice = await stripe.prices.create({
      product: productId,
      unit_amount: Math.round(price * 100), // Stripe utilise les centimes
      currency,
      active: true
    });

    return stripePrice.id;
  } catch (error) {
    console.error('❌ Erreur lors de la création du prix Stripe:', error);
    throw error;
  }
};

export const updateSpacePrices = async (
  spaceId: string,
  stripeProductId: string,
  stripePriceId: string
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('spaces')
      .update({
        stripe_product_id: stripeProductId,
        stripe_price_id: stripePriceId,
        updated_at: new Date().toISOString()
      })
      .eq('id', spaceId);

    if (error) throw error;
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour des prix dans Supabase:', error);
    throw error;
  }
};

export const logPriceValidation = (spaceId: string, validation: PriceValidation): void => {
  if (!validation.isValid) {
    console.warn(`⚠️ Espace ${spaceId}: ${validation.error}`);
    return;
  }

  console.log(`✅ Espace ${spaceId}: Prix validés`, {
    priceHT: validation.priceHT,
    priceTTC: validation.priceTTC
  });
}; 