# Guide de Vérification des Secrets Supabase

## Problème
Les scripts de diagnostic ne peuvent pas accéder directement aux secrets Supabase via SQL car ils sont protégés.

## Solution : Vérification via l'Interface Supabase

### 1. Accéder aux Secrets via l'Interface Web

1. **Ouvrir le Dashboard Supabase** :
   - Aller sur https://supabase.com/dashboard
   - Sélectionner votre projet

2. **Accéder aux Settings** :
   - Cliquer sur "Settings" dans le menu de gauche
   - Aller dans "API" ou "Edge Functions"

3. **Vérifier les Secrets** :
   - Dans "Edge Functions" > "Settings"
   - Vérifier que les secrets suivants sont configurés :
     - `STRIPE_SECRET_KEY`
     - `STRIPE_PUBLISHABLE_KEY`
     - `SUPABASE_SERVICE_ROLE_KEY`

### 2. Configuration des Secrets via CLI

```bash
# Vérifier les secrets existants
npx supabase secrets list

# Ajouter/Modifier un secret
npx supabase secrets set STRIPE_SECRET_KEY=sk_test_...

# Vérifier un secret spécifique
npx supabase secrets get STRIPE_SECRET_KEY
```

### 3. Scripts de Test Corrigés

#### Test Simple HTTP_POST
```sql
-- test_http_post_simple.sql
SELECT 
    *
FROM net.http_post(
    'https://httpbin.org/post',
    '{"Content-Type": "application/json"}'::jsonb,
    '{"test": "pg_net working"}'::jsonb
);
```

#### Vérification des Secrets
```sql
-- verifier_secrets_supabase.sql
-- Vérifier les paramètres de configuration
SELECT 
    name,
    setting,
    context
FROM pg_settings 
WHERE name LIKE '%stripe%' 
   OR name LIKE '%service%'
   OR name LIKE '%key%'
ORDER BY name;
```

### 4. Vérification de l'Edge Function

#### Via CLI
```bash
# Lister les edge functions
npx supabase functions list

# Vérifier le statut de sync-space-stripe
npx supabase functions serve sync-space-stripe

# Tester l'edge function
curl -X POST https://exffryodynkyizbeesbt.supabase.co/functions/v1/sync-space-stripe \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{"type":"TEST","table":"spaces","record":{"id":"test","name":"Test"}}'
```

#### Via Interface Web
1. Aller dans "Edge Functions"
2. Vérifier que `sync-space-stripe` est déployée
3. Cliquer sur "Invoke" pour tester

### 5. Diagnostic Complet

#### Étape 1 : Vérifier pg_net
```sql
SELECT 
    extname,
    extversion
FROM pg_extension 
WHERE extname = 'pg_net';
```

#### Étape 2 : Tester HTTP_POST
```sql
SELECT 
    *
FROM net.http_post(
    'https://httpbin.org/get',
    '{}'::jsonb,
    ''::text
);
```

#### Étape 3 : Vérifier le Trigger
```sql
SELECT 
    trigger_name,
    event_manipulation,
    action_timing
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_stripe_sync_on_spaces';
```

#### Étape 4 : Tester la Création d'Espace
```sql
INSERT INTO spaces (
    name,
    description,
    capacity,
    price_per_hour,
    is_active,
    created_by
) VALUES (
    'Test Secret ' || now()::text,
    'Test de création d''espace',
    1,
    10.00,
    true,
    '00000000-0000-0000-0000-000000000000'
) RETURNING id, name, created_at;
```

### 6. Résolution des Problèmes

#### Si les secrets ne sont pas configurés :
```bash
# Configurer les secrets Stripe
npx supabase secrets set STRIPE_SECRET_KEY=sk_test_votre_cle_secrete
npx supabase secrets set STRIPE_PUBLISHABLE_KEY=pk_test_votre_cle_publique

# Redéployer l'edge function
npx supabase functions deploy sync-space-stripe
```

#### Si l'edge function n'est pas déployée :
```bash
# Déployer l'edge function
npx supabase functions deploy sync-space-stripe

# Vérifier le déploiement
npx supabase functions list
```

#### Si le trigger ne fonctionne pas :
```sql
-- Recréer le trigger
DROP TRIGGER IF EXISTS trigger_stripe_sync_on_spaces ON spaces;

CREATE TRIGGER trigger_stripe_sync_on_spaces
    AFTER INSERT OR UPDATE OR DELETE ON spaces
    FOR EACH ROW
    EXECUTE FUNCTION sync_space_with_stripe();
```

### 7. Monitoring

#### Vérifier les Logs
- Interface Supabase > Logs
- Filtrer par "Edge Functions"
- Chercher les appels à `sync-space-stripe`

#### Vérifier Stripe
- Dashboard Stripe > Products
- Vérifier que les produits sont créés automatiquement

### 8. Scripts de Diagnostic Corrigés

Utiliser les fichiers suivants :
- `test_http_post_simple.sql` : Test simple de HTTP_POST
- `verifier_secrets_supabase.sql` : Vérification des paramètres
- `diagnostic_complet_systeme_corrige.sql` : Diagnostic complet

Ces scripts évitent les erreurs de colonnes inexistantes et utilisent les bonnes méthodes pour Supabase. 