#!/bin/bash

# Script de bascule Stripe test/production pour Supabase
# Usage : ./scripts/switch-stripe-mode.sh test|prod <CLE_STRIPE_SECRET> <CLE_STRIPE_PUBLISHABLE>

MODE=$1
STRIPE_SECRET_KEY=$2
STRIPE_PUBLISHABLE_KEY=$3

if [ -z "$MODE" ] || [ -z "$STRIPE_SECRET_KEY" ]; then
  echo "Usage : $0 test|prod <CLE_STRIPE_SECRET> [CLE_STRIPE_PUBLISHABLE]"
  exit 1
fi

if [ "$MODE" != "test" ] && [ "$MODE" != "prod" ]; then
  echo "Le mode doit être 'test' ou 'prod'"
  exit 1
fi

# Met à jour la clé secrète Stripe
npx supabase secrets set STRIPE_SECRET_KEY=$STRIPE_SECRET_KEY

# Met à jour la clé publishable si fournie
if [ ! -z "$STRIPE_PUBLISHABLE_KEY" ]; then
  npx supabase secrets set VITE_STRIPE_PUBLISHABLE_KEY=$STRIPE_PUBLISHABLE_KEY
fi

# Redéploie l'edge function
npx supabase functions deploy sync-space-stripe

echo "✅ Stripe basculé en mode $MODE !"
echo "- Clé secrète : $STRIPE_SECRET_KEY"
if [ ! -z "$STRIPE_PUBLISHABLE_KEY" ]; then
  echo "- Clé publishable : $STRIPE_PUBLISHABLE_KEY"
fi 