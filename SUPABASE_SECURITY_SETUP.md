# Configuration Sécurité Supabase

## 🔒 Protection des mots de passe compromis

### 1. Activer la protection dans Supabase Dashboard

1. **Accéder au Dashboard Supabase**
   - Connectez-vous à https://supabase.com/dashboard
   - Sélectionnez votre projet

2. **Aller dans Authentication > Settings**
   - Cliquez sur "Authentication" dans le menu de gauche
   - Puis "Settings"

3. **Activer "Leaked Password Protection"**
   - Trouvez la section "Security"
   - Activez "Leaked Password Protection"
   - Cette fonctionnalité vérifie les mots de passe contre HaveIBeenPwned.org

### 2. Configuration RLS (Row Level Security)

```sql
-- Activer RLS sur toutes les tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_slots ENABLE ROW LEVEL SECURITY;

-- Politique pour profiles
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND is_admin = true
        )
    );

-- Politique pour spaces
CREATE POLICY "Anyone can view active spaces" ON spaces
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage spaces" ON spaces
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND is_admin = true
        )
    );

-- Politique pour bookings
CREATE POLICY "Users can view own bookings" ON bookings
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create own bookings" ON bookings
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all bookings" ON bookings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND is_admin = true
        )
    );
```

### 3. Configuration des variables d'environnement

```bash
# .env.local
VITE_SUPABASE_URL=https://exffryodynkyizbeesbt.supabase.co
VITE_SUPABASE_ANON_KEY=votre_clé_anon
VITE_SUPABASE_SERVICE_ROLE_KEY=votre_clé_service_role
```

## 🛡️ Autres recommandations de sécurité

### 1. Limiter les tentatives de connexion
- Configurer le rate limiting dans Supabase
- Activer la vérification email obligatoire

### 2. Audit des permissions
- Vérifier régulièrement les politiques RLS
- Révoquer les tokens expirés

### 3. Monitoring
- Activer les logs d'audit
- Surveiller les tentatives de connexion échouées 