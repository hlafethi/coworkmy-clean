-- Création de la table FAQ
CREATE TABLE IF NOT EXISTS support_faqs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    category VARCHAR(100) DEFAULT 'general',
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_support_faqs_category ON support_faqs(category);
CREATE INDEX IF NOT EXISTS idx_support_faqs_order ON support_faqs(order_index);
CREATE INDEX IF NOT EXISTS idx_support_faqs_active ON support_faqs(is_active);

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_support_faqs_updated_at 
    BEFORE UPDATE ON support_faqs 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Politiques RLS pour la table FAQ
ALTER TABLE support_faqs ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre la lecture à tous les utilisateurs (FAQ publiques)
CREATE POLICY "FAQ publiques - lecture pour tous" ON support_faqs
    FOR SELECT USING (is_active = true);

-- Politique pour permettre la gestion complète aux admins
CREATE POLICY "FAQ - gestion complète admin" ON support_faqs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.is_admin = true
        )
    );

-- Insertion des FAQ par défaut
INSERT INTO support_faqs (question, answer, category, order_index) VALUES
(
    'Comment réserver un espace de coworking ?',
    'Pour réserver un espace, connectez-vous à votre compte, sélectionnez l''espace souhaité, choisissez une date et un créneau horaire disponible, puis procédez au paiement pour confirmer votre réservation.',
    'reservation',
    1
),
(
    'Quels sont les moyens de paiement acceptés ?',
    'Nous acceptons les paiements par carte bancaire (Visa, Mastercard), PayPal, et virement bancaire pour les abonnements mensuels ou annuels.',
    'paiement',
    2
),
(
    'Comment annuler ou modifier ma réservation ?',
    'Vous pouvez annuler ou modifier votre réservation jusqu''à 24 heures avant le début de votre créneau. Rendez-vous dans votre espace personnel, section ''Mes réservations'', et cliquez sur ''Modifier'' ou ''Annuler''.',
    'reservation',
    3
),
(
    'Les espaces sont-ils accessibles 24h/24 ?',
    'Nos espaces sont accessibles de 7h à 22h en semaine, et de 9h à 18h le week-end. Les membres avec un abonnement Premium bénéficient d''un accès 24h/24 via notre système de badge électronique.',
    'acces',
    4
),
(
    'Y a-t-il du Wi-Fi dans tous les espaces ?',
    'Oui, tous nos espaces sont équipés d''une connexion Wi-Fi fibre haut débit sécurisée. Les identifiants de connexion vous seront communiqués lors de votre arrivée.',
    'services',
    5
);

-- Vérification de la création
SELECT 'Table support_faqs créée avec succès' as status;
SELECT COUNT(*) as nombre_faqs FROM support_faqs; 