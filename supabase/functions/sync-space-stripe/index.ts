// Edge Function Supabase : Synchronisation automatique d'un espace avec Stripe
// Ce squelette gère les events INSERT, UPDATE, DELETE sur la table 'spaces'
// et synchronise le produit/prix Stripe correspondant.
// Clé Stripe à stocker dans les secrets Supabase (pas en dur !)

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";

// Utilise Deno.env pour récupérer la clé Stripe (stockée via supabase secrets)
const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');

if (!STRIPE_SECRET_KEY) {
  throw new Error('La clé Stripe n\'est pas configurée dans les secrets Supabase !');
}

// Import Stripe SDK (npm:stripe)
import Stripe from 'npm:stripe';
const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });

serve(async (req) => {
  try {
    const body = await req.json();
    const { type, table, record, old_record } = body;

    // Log de debug
    console.log('[sync-space-stripe] Event reçu :', { type, table, record, old_record });

    if (table !== 'spaces') {
      return new Response('Ignored: not a spaces event', { status: 200 });
    }

    // INSERT : Créer le produit Stripe
    if (type === 'INSERT') {
      console.log('[sync-space-stripe] Création produit Stripe pour:', record.name);
      
      try {
        // VÉRIFICATION DE DOUBLON : Vérifier si l'espace a déjà des IDs Stripe
        if (record.stripe_product_id && record.stripe_price_id) {
          console.log('[sync-space-stripe] Espace déjà synchronisé avec Stripe:', {
            space_id: record.id,
            stripe_product_id: record.stripe_product_id,
            stripe_price_id: record.stripe_price_id
          });
          
          // Vérifier si le produit Stripe existe toujours
          try {
            const existingProduct = await stripe.products.retrieve(record.stripe_product_id);
            const existingPrice = await stripe.prices.retrieve(record.stripe_price_id);
            
            console.log('[sync-space-stripe] Produit et prix Stripe existants vérifiés:', {
              product_active: existingProduct.active,
              price_active: existingPrice.active
            });
            
            return new Response(JSON.stringify({ 
              success: true, 
              message: 'Espace déjà synchronisé',
              product_id: record.stripe_product_id, 
              price_id: record.stripe_price_id 
            }), { status: 200 });
          } catch (stripeError) {
            console.log('[sync-space-stripe] Produit Stripe introuvable, création d\'un nouveau:', stripeError.message);
            // Continuer avec la création d'un nouveau produit
          }
        }

        // VÉRIFICATION DE DOUBLON : Chercher un produit existant avec le même nom
        const existingProducts = await stripe.products.list({
          limit: 100,
          active: true
        });

        const duplicateProduct = existingProducts.data.find(product => 
          product.name === record.name && 
          product.metadata?.space_id !== record.id
        );

        if (duplicateProduct) {
          console.log('[sync-space-stripe] Produit Stripe avec le même nom trouvé:', {
            existing_product_id: duplicateProduct.id,
            existing_space_id: duplicateProduct.metadata?.space_id,
            new_space_id: record.id
          });
          
          // Retourner une erreur pour éviter la confusion
          return new Response(JSON.stringify({ 
            error: 'Un produit Stripe avec le même nom existe déjà',
            duplicate_product_id: duplicateProduct.id,
            existing_space_id: duplicateProduct.metadata?.space_id
          }), { status: 409 });
        }

        // Créer le produit Stripe
        const product = await stripe.products.create({
          name: record.name,
          description: record.description || `Espace de coworking: ${record.name}`,
          metadata: {
            space_id: record.id,
            capacity: record.capacity?.toString() || '0',
            type: 'coworking_space'
          }
        });

        // Créer le prix Stripe
        const price = await stripe.prices.create({
          product: product.id,
          unit_amount: Math.round((record.price_per_hour || 0) * 100), // Stripe utilise les centimes
          currency: 'eur',
          metadata: {
            space_id: record.id,
            price_type: 'per_hour'
          }
        });

        // Mettre à jour l'espace avec les IDs Stripe
        const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
        const supabaseUrl = 'https://exffryodynkyizbeesbt.supabase.co';
        const supabaseServiceKey = Deno.env.get('SERVICE_ROLE_KEY');
        
        if (supabaseServiceKey) {
          const supabase = createClient(supabaseUrl, supabaseServiceKey);
          
          const { error: updateError } = await supabase
            .from('spaces')
            .update({
              stripe_product_id: product.id,
              stripe_price_id: price.id,
              last_stripe_sync: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', record.id);

          if (updateError) {
            console.error('[sync-space-stripe] Erreur mise à jour base de données:', updateError);
            return new Response(JSON.stringify({ 
              error: 'Erreur mise à jour base de données',
              details: updateError 
            }), { status: 500 });
          }

          console.log('[sync-space-stripe] Base de données mise à jour avec succès');
        } else {
          console.error('[sync-space-stripe] SERVICE_ROLE_KEY non configuré');
          return new Response(JSON.stringify({ 
            error: 'SERVICE_ROLE_KEY non configuré' 
          }), { status: 500 });
        }

        console.log('[sync-space-stripe] Produit et prix Stripe créés:', { product_id: product.id, price_id: price.id });
        return new Response(JSON.stringify({ 
          success: true, 
          product_id: product.id, 
          price_id: price.id,
          message: 'Synchronisation réussie'
        }), { status: 200 });
      } catch (error) {
        console.error('[sync-space-stripe] Erreur création produit Stripe:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
      }
    }

    // UPDATE : Mettre à jour le produit Stripe
    if (type === 'UPDATE') {
      console.log('[sync-space-stripe] Update produit Stripe pour:', record.name);
      
      try {
        // VÉRIFICATION DE DOUBLON : Si le nom a changé, vérifier qu'il n'y a pas de conflit
        if (old_record?.name !== record.name) {
          const existingProducts = await stripe.products.list({
            limit: 100,
            active: true
          });

          const duplicateProduct = existingProducts.data.find(product => 
            product.name === record.name && 
            product.metadata?.space_id !== record.id
          );

          if (duplicateProduct) {
            console.log('[sync-space-stripe] Conflit de nom détecté lors de la mise à jour:', {
              existing_product_id: duplicateProduct.id,
              existing_space_id: duplicateProduct.metadata?.space_id,
              current_space_id: record.id
            });
            
            return new Response(JSON.stringify({ 
              error: 'Un produit Stripe avec le nouveau nom existe déjà',
              duplicate_product_id: duplicateProduct.id,
              existing_space_id: duplicateProduct.metadata?.space_id
            }), { status: 409 });
          }
        }

        if (!record.stripe_product_id) {
          console.log('[sync-space-stripe] Pas d\'ID produit Stripe, création d\'un nouveau produit');
          // Créer un nouveau produit si pas d'ID existant
          const product = await stripe.products.create({
            name: record.name,
            description: record.description || `Espace de coworking: ${record.name}`,
            metadata: {
              space_id: record.id,
              capacity: record.capacity?.toString() || '0',
              type: 'coworking_space'
            }
          });

          const price = await stripe.prices.create({
            product: product.id,
            unit_amount: Math.round((record.price_per_hour || 0) * 100),
            currency: 'eur',
            metadata: {
              space_id: record.id,
              price_type: 'per_hour'
            }
          });

          // Mettre à jour l'espace
          const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
          const supabaseUrl = 'https://exffryodynkyizbeesbt.supabase.co';
          const supabaseServiceKey = Deno.env.get('SERVICE_ROLE_KEY');
          
          if (supabaseServiceKey) {
            const supabase = createClient(supabaseUrl, supabaseServiceKey);
            
            const { error: updateError } = await supabase
              .from('spaces')
              .update({
                stripe_product_id: product.id,
                stripe_price_id: price.id,
                last_stripe_sync: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .eq('id', record.id);

            if (updateError) {
              console.error('[sync-space-stripe] Erreur mise à jour base de données:', updateError);
              return new Response(JSON.stringify({ 
                error: 'Erreur mise à jour base de données',
                details: updateError 
              }), { status: 500 });
            }
          }

          console.log('[sync-space-stripe] Nouveau produit et prix créés lors de la mise à jour:', { product_id: product.id, price_id: price.id });
          return new Response(JSON.stringify({ success: true, product_id: product.id, price_id: price.id }), { status: 200 });
        }

        // Mettre à jour le produit Stripe existant
        await stripe.products.update(record.stripe_product_id, {
          name: record.name,
          description: record.description || `Espace de coworking: ${record.name}`,
          metadata: {
            space_id: record.id,
            capacity: record.capacity?.toString() || '0',
            type: 'coworking_space'
          }
        });

        // Mettre à jour le prix si nécessaire
        if (old_record?.price_per_hour !== record.price_per_hour) {
          // Créer un nouveau prix (les prix Stripe sont immutables)
          const newPrice = await stripe.prices.create({
            product: record.stripe_product_id,
            unit_amount: Math.round((record.price_per_hour || 0) * 100),
            currency: 'eur',
            metadata: {
              space_id: record.id,
              price_type: 'per_hour'
            }
          });

          // Mettre à jour l'espace avec le nouveau prix
          const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
          const supabaseUrl = 'https://exffryodynkyizbeesbt.supabase.co';
          const supabaseServiceKey = Deno.env.get('SERVICE_ROLE_KEY');
          
          if (supabaseServiceKey) {
            const supabase = createClient(supabaseUrl, supabaseServiceKey);
            
            await supabase
              .from('spaces')
              .update({
                stripe_price_id: newPrice.id,
                last_stripe_sync: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .eq('id', record.id);
          }

          console.log('[sync-space-stripe] Produit et prix mis à jour:', { product_id: record.stripe_product_id, new_price_id: newPrice.id });
          return new Response(JSON.stringify({ success: true, product_id: record.stripe_product_id, price_id: newPrice.id }), { status: 200 });
        } else {
          // Mettre à jour seulement le timestamp de synchronisation
          const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
          const supabaseUrl = 'https://exffryodynkyizbeesbt.supabase.co';
          const supabaseServiceKey = Deno.env.get('SERVICE_ROLE_KEY');
          
          if (supabaseServiceKey) {
            const supabase = createClient(supabaseUrl, supabaseServiceKey);
            
            await supabase
              .from('spaces')
              .update({
                last_stripe_sync: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .eq('id', record.id);
          }

          console.log('[sync-space-stripe] Produit mis à jour:', { product_id: record.stripe_product_id });
          return new Response(JSON.stringify({ success: true, product_id: record.stripe_product_id }), { status: 200 });
        }
      } catch (error) {
        console.error('[sync-space-stripe] Erreur mise à jour produit Stripe:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
      }
    }

    // DELETE : Archiver le produit Stripe
    if (type === 'DELETE') {
      console.log('[sync-space-stripe] Suppression produit Stripe pour:', old_record.name);
      
      try {
        if (old_record.stripe_product_id) {
          // Archiver le produit Stripe (ne pas le supprimer complètement)
          await stripe.products.update(old_record.stripe_product_id, {
            active: false
          });

          console.log('[sync-space-stripe] Produit Stripe archivé:', { product_id: old_record.stripe_product_id });
          return new Response(JSON.stringify({ success: true, message: 'Produit archivé' }), { status: 200 });
        } else {
          console.log('[sync-space-stripe] Pas d\'ID produit Stripe à archiver');
          return new Response(JSON.stringify({ success: true, message: 'Pas de produit à archiver' }), { status: 200 });
        }
      } catch (error) {
        console.error('[sync-space-stripe] Erreur archivage produit Stripe:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
      }
    }

    return new Response(JSON.stringify({ error: 'Type d\'événement non supporté' }), { status: 400 });
  } catch (error) {
    console.error('[sync-space-stripe] Erreur générale:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}); 