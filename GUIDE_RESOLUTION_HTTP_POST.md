# Guide de Résolution - Erreur HTTP_POST

## Problème
```
ERROR: 42883: function net.http_post(url => unknown, headers => jsonb, body => text) does not exist
```

## Cause
La signature de la fonction `net.http_post` n'était pas correcte. Dans Supabase, la fonction attend des paramètres spécifiques.

## Solution Appliquée

### 1. Migration de Correction
Le fichier `supabase/migrations/20250705000004_fix_trigger_signature.sql` a été créé pour corriger la signature.

### 2. Signature Correcte
```sql
-- Signature correcte pour Supabase
net.http_post(
    url TEXT,
    headers JSONB,
    body JSONB  -- Note: JSONB au lieu de TEXT
)
```

### 3. Fonction Trigger Corrigée
```sql
CREATE OR REPLACE FUNCTION sync_space_with_stripe()
RETURNS TRIGGER AS $$
DECLARE
    payload JSONB;
    response_status INTEGER;
    response_body TEXT;
BEGIN
    -- Construire le payload
    IF TG_OP = 'INSERT' THEN
        payload := jsonb_build_object(
            'type', 'INSERT',
            'table', TG_TABLE_NAME,
            'record', to_jsonb(NEW),
            'old_record', NULL
        );
    ELSIF TG_OP = 'UPDATE' THEN
        payload := jsonb_build_object(
            'type', 'UPDATE',
            'table', TG_TABLE_NAME,
            'record', to_jsonb(NEW),
            'old_record', to_jsonb(OLD)
        );
    ELSIF TG_OP = 'DELETE' THEN
        payload := jsonb_build_object(
            'type', 'DELETE',
            'table', TG_TABLE_NAME,
            'record', NULL,
            'old_record', to_jsonb(OLD)
        );
    END IF;

    -- Appel HTTP avec la bonne signature
    SELECT 
        status,
        content
    INTO 
        response_status,
        response_body
    FROM 
        net.http_post(
            'https://exffryodynkyizbeesbt.supabase.co/functions/v1/sync-space-stripe',
            jsonb_build_object(
                'Content-Type', 'application/json',
                'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
            ),
            payload  -- JSONB au lieu de TEXT
        );

    -- Log de debug
    RAISE LOG 'Stripe sync trigger: % on space % (status: %, response: %)', 
        TG_OP, 
        COALESCE(NEW.id, OLD.id), 
        response_status, 
        response_body;

    -- Retourner le record approprié
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;

EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'Erreur dans sync_space_with_stripe: %', SQLERRM;
    
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Vérifications

### 1. Tester la Fonction HTTP_POST
```sql
-- Test simple
SELECT 
    status,
    content
FROM net.http_post(
    'https://httpbin.org/post',
    '{"Content-Type": "application/json"}'::jsonb,
    '{"test": "pg_net working"}'::jsonb
);
```

### 2. Vérifier l'Installation de pg_net
```sql
SELECT 
    extname,
    extversion
FROM pg_extension 
WHERE extname = 'pg_net';
```

### 3. Vérifier les Fonctions Disponibles
```sql
SELECT 
    proname,
    pg_get_function_arguments(oid) as arguments
FROM pg_proc 
WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'net')
AND proname LIKE '%http%';
```

## Scripts de Diagnostic

### Diagnostic Complet
Exécuter `diagnostic_complet_systeme.sql` pour une vérification complète.

### Test Simple
Exécuter `test_http_post_final.sql` pour tester la fonction HTTP.

## Déploiement

1. **Pousser les migrations** :
   ```bash
   npx supabase db push
   ```

2. **Vérifier le trigger** :
   ```sql
   SELECT 
       trigger_name,
       event_manipulation,
       action_timing
   FROM information_schema.triggers 
   WHERE trigger_name = 'trigger_stripe_sync_on_spaces';
   ```

3. **Tester la synchronisation** :
   - Créer un nouvel espace dans l'admin
   - Vérifier les logs dans Supabase
   - Contrôler que le produit Stripe est créé

## Points Clés

- ✅ **pg_net** doit être installé
- ✅ **Signature correcte** : `(url, headers, body)` avec `body` en JSONB
- ✅ **Trigger** doit être recréé avec la nouvelle fonction
- ✅ **Edge function** doit être déployée et accessible
- ✅ **Secrets** Supabase doivent être configurés

## Résolution Automatique

Le système corrige automatiquement :
- La signature de la fonction HTTP
- La création du trigger
- La gestion des erreurs
- Les logs de debug

La synchronisation Stripe devrait maintenant fonctionner correctement lors de la création/modification d'espaces. 