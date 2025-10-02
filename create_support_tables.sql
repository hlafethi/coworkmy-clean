-- Créer les tables support si elles n'existent pas

-- Table support_tickets
CREATE TABLE IF NOT EXISTS support_tickets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    priority VARCHAR(50) DEFAULT 'medium',
    status VARCHAR(50) DEFAULT 'open',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Table support_faqs
CREATE TABLE IF NOT EXISTS support_faqs (
    id SERIAL PRIMARY KEY,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    category VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Table support_ticket_responses
CREATE TABLE IF NOT EXISTS support_ticket_responses (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_admin_response BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Insérer des FAQ d'exemple
INSERT INTO support_faqs (question, answer, category) VALUES
('Comment réserver un espace ?', 'Vous pouvez réserver un espace en cliquant sur le bouton "Réserver" de l\'espace souhaité.', 'Réservation'),
('Quels sont les moyens de paiement ?', 'Nous acceptons les cartes bancaires et les virements.', 'Paiement'),
('Puis-je annuler ma réservation ?', 'Oui, vous pouvez annuler votre réservation jusqu\'à 24h avant la date prévue.', 'Annulation')
ON CONFLICT DO NOTHING;
