#!/bin/bash

# Script de nettoyage des fichiers temporaires de diagnostic Stripe

echo "🧹 Nettoyage des fichiers temporaires de diagnostic..."

# Supprimer les fichiers de test temporaires
rm -f test-stripe-portal.js
rm -f test-stripe-portal-with-auth.js
rm -f test-debug-stripe.js
rm -f test-stripe-portal-final.js

# Supprimer les scripts SQL temporaires
rm -f check_stripe_config.sql
rm -f check_current_stripe_config.sql
rm -f fix_stripe_config.sql
rm -f fix_stripe_config_with_real_keys.sql
rm -f fix-stripe-keys-simple.sql
rm -f fix-stripe-config-complete.sql

# Supprimer les fonctions Edge temporaires (optionnel)
echo "⚠️  Les fonctions Edge debug-stripe-config et fix-stripe-keys peuvent être supprimées manuellement si nécessaire"

echo "✅ Nettoyage terminé"
echo ""
echo "📋 Fichiers conservés :"
echo "- RESOLUTION_STRIPE_PORTAL.md (guide de résolution)"
echo "- supabase/functions/create-customer-portal/index.ts (fonction principale)"
echo "- src/utils/stripeUtils.ts (client Stripe amélioré)"
echo "- src/components/common/StripeCustomerPortal.tsx (composant)" 