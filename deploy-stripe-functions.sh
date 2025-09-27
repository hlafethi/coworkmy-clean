#!/bin/bash

# Script de déploiement des fonctions Stripe
echo "🚀 Déploiement des fonctions de synchronisation Stripe..."

# Vérifier que Supabase CLI est installé
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI n'est pas installé. Veuillez l'installer d'abord."
    exit 1
fi

# Déployer la fonction de synchronisation complète
echo "📦 Déploiement de create-stripe-catalog..."
supabase functions deploy create-stripe-catalog

# Déployer la fonction de synchronisation individuelle
echo "📦 Déploiement de sync-space-stripe..."
supabase functions deploy sync-space-stripe

echo "✅ Déploiement terminé !"
echo ""
echo "📋 Prochaines étapes :"
echo "1. Appliquer la migration SQL : supabase/migrations/20250702000001_add_stripe_sync_trigger.sql"
echo "2. Configurer les variables d'environnement Stripe dans Supabase"
echo "3. Tester la synchronisation en créant un nouvel espace" 