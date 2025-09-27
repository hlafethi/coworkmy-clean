# 🔒 Guide de Configuration Sécurité Supabase - CoWorkMy

## 🎯 Objectif

Ce guide vous aide à configurer correctement Supabase pour CoWorkMy, en incluant les corrections de synchronisation admin et les bonnes pratiques de sécurité.

## 📋 Prérequis

- Accès au Dashboard Supabase
- Permissions d'administrateur sur le projet
- Connaissance de base de SQL

## 🚀 Configuration Étape par Étape

### 1. 🔐 Protection des Mots de Passe Compromis

**Dans le Dashboard Supabase :**
1. Aller dans **Authentication > Settings**
2. Activer **"Leaked Password Protection"**
3. Cette fonctionnalité vérifie les mots de passe contre HaveIBeenPwned.org

### 2. 🛡️ Configuration RLS (Row Level Security)

Exécuter ce script dans **SQL Editor** :

```sql
-- Activer RLS sur toutes les tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_configs ENABLE ROW LEVEL SECURITY;

-- Politiques pour profiles
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" ON profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE user_id = auth.uid() AND is_admin = true
        )
    );

CREATE POLICY "Admins can update all profiles" ON profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE user_id = auth.uid() AND is_admin = true
        )
    );

-- Politiques pour spaces
CREATE POLICY "Anyone can view active spaces" ON spaces
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage spaces" ON spaces
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE user_id = auth.uid() AND is_admin = true
        )
    );

-- Politiques pour bookings
CREATE POLICY "Users can view own bookings" ON bookings
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create own bookings" ON bookings
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own bookings" ON bookings
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Admins can view all bookings" ON bookings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE user_id = auth.uid() AND is_admin = true
        )
    );

CREATE POLICY "Admins can update all bookings" ON bookings
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE user_id = auth.uid() AND is_admin = true
        )
    );

-- Politiques pour time_slots
CREATE POLICY "Anyone can view time slots" ON time_slots
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage time slots" ON time_slots
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE user_id = auth.uid() AND is_admin = true
        )
    );

-- Politiques pour app_settings (admin seulement)
CREATE POLICY "Admins can manage app settings" ON app_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE user_id = auth.uid() AND is_admin = true
        )
    );

-- Politiques pour email_configs (admin seulement)
CREATE POLICY "Admins can manage email configs" ON email_configs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE user_id = auth.uid() AND is_admin = true
        )
    );
```

### 3. 🔧 Correction de la Synchronisation Admin

Si vous rencontrez des problèmes d'accès admin, exécuter ce script :

```sql
-- Script de correction rapide pour l'accès admin
-- À exécuter dans SQL Editor

-- 1. Vérifier l'état actuel
SELECT 
    'État actuel' as étape,
    au.email,
    au.email_confirmed_at,
    p.is_admin,
    p.user_id = au.id as user_id_match
FROM auth.users au
LEFT JOIN profiles p ON au.email = p.email
WHERE au.email = 'sciandrea42@gmail.com';

-- 2. Forcer la mise à jour du profil admin
UPDATE profiles 
SET 
    is_admin = true,
    user_id = (SELECT id FROM auth.users WHERE email = 'sciandrea42@gmail.com'),
    updated_at = NOW()
WHERE email = 'sciandrea42@gmail.com';

-- 3. Créer le profil s'il n'existe pas
INSERT INTO profiles (id, user_id, email, is_admin, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    au.id,
    au.email,
    true,
    NOW(),
    NOW()
FROM auth.users au
WHERE au.email = 'sciandrea42@gmail.com'
AND NOT EXISTS (
    SELECT 1 FROM profiles WHERE email = au.email
);

-- 4. Confirmer l'email si nécessaire
UPDATE auth.users 
SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
WHERE email = 'sciandrea42@gmail.com';

-- 5. Nettoyer les sessions
DELETE FROM auth.sessions 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'sciandrea42@gmail.com');

-- 6. Vérifier le résultat
SELECT 
    'Résultat final' as étape,
    au.email,
    au.email_confirmed_at,
    p.is_admin,
    p.user_id = au.id as user_id_match,
    '✅ Problème résolu - Reconnectez-vous maintenant' as action
FROM auth.users au
LEFT JOIN profiles p ON au.email = p.email
WHERE au.email = 'sciandrea42@gmail.com';
```

### 4. 🌐 Configuration des Variables d'Environnement

Vérifier que ces variables sont configurées dans votre application :

```env
# Configuration Supabase
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre_clé_anon_ici

# Configuration Stripe
VITE_STRIPE_PUBLISHABLE_KEY=votre_clé_stripe_ici

# Configuration Google
VITE_GOOGLE_PLACES_API_KEY=votre_clé_google_ici

# Mode de développement
VITE_DEV_MODE=false
```

### 5. 📊 Monitoring et Audit

**Activer les logs d'audit :**
1. Aller dans **Settings > Logs**
2. Activer **"Enable Logs"**
3. Configurer les alertes pour :
   - Tentatives de connexion échouées
   - Activités suspectes
   - Erreurs de base de données

### 6. 🔍 Diagnostic des Problèmes

**Script de diagnostic complet :**

```sql
-- Diagnostic complet de l'état de l'application
-- Exécuter dans SQL Editor

-- 1. Vérifier l'état des utilisateurs
SELECT 
    'Utilisateurs' as section,
    COUNT(*) as total_users,
    COUNT(CASE WHEN email_confirmed_at IS NOT NULL THEN 1 END) as confirmed_users,
    COUNT(CASE WHEN last_sign_in_at IS NOT NULL THEN 1 END) as active_users
FROM auth.users;

-- 2. Vérifier les profils admin
SELECT 
    'Profils Admin' as section,
    COUNT(*) as total_profiles,
    COUNT(CASE WHEN is_admin = true THEN 1 END) as admin_profiles,
    COUNT(CASE WHEN user_id IS NOT NULL THEN 1 END) as linked_profiles
FROM profiles;

-- 3. Vérifier les politiques RLS
SELECT 
    'Politiques RLS' as section,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 4. Vérifier les sessions actives
SELECT 
    'Sessions' as section,
    COUNT(*) as active_sessions,
    MAX(created_at) as last_session_created
FROM auth.sessions;

-- 5. Vérifier les performances
SELECT 
    'Performance' as section,
    schemaname,
    tablename,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes,
    n_live_tup as live_rows
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC;
```

## 🚨 Résolution des Problèmes Courants

### Problème : Accès Admin Refusé

**Symptômes :**
- `useAuth` détecte admin: true
- `AdminRoute` reçoit isAdmin: false
- Redirection vers dashboard utilisateur

**Solution :**
1. Exécuter le script de correction admin
2. Se déconnecter complètement
3. Vider le cache du navigateur
4. Se reconnecter

### Problème : Erreur 403 Forbidden

**Symptômes :**
- Erreur 403 sur les requêtes Supabase
- Problèmes de CSP (Content Security Policy)

**Solution :**
1. Vérifier les politiques RLS
2. Ajuster la CSP dans .htaccess/web.config
3. Vérifier les permissions utilisateur

### Problème : Synchronisation Réelle

**Symptômes :**
- Données non synchronisées en temps réel
- WebSocket déconnecté

**Solution :**
1. Vérifier la configuration WebSocket
2. Ajuster les timeouts
3. Vérifier les politiques de reconnexion

## 📈 Bonnes Pratiques

### Sécurité
- ✅ Toujours utiliser RLS
- ✅ Limiter les permissions au minimum nécessaire
- ✅ Surveiller les logs d'audit
- ✅ Utiliser des mots de passe forts

### Performance
- ✅ Indexer les colonnes fréquemment utilisées
- ✅ Optimiser les requêtes
- ✅ Utiliser la pagination
- ✅ Surveiller les performances

### Maintenance
- ✅ Sauvegarder régulièrement
- ✅ Mettre à jour les dépendances
- ✅ Surveiller les logs
- ✅ Tester les sauvegardes

## 🎉 Résultat Final

Après configuration :
- ✅ **Sécurité renforcée**
- ✅ **Accès admin fonctionnel**
- ✅ **Synchronisation réelle active**
- ✅ **Performance optimisée**
- ✅ **Monitoring en place**

## 📞 Support

En cas de problème :
1. Vérifier les logs Supabase
2. Exécuter les scripts de diagnostic
3. Consulter la documentation officielle
4. Contacter le support si nécessaire

---

**⏱️ Temps de configuration : 15-30 minutes**

**🎯 Niveau de sécurité : Élevé** 