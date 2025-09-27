-- =====================================================
-- SCHÉMA DE BASE DE DONNÉES MYSQL POUR COWORKMY
-- =====================================================

-- Création de la base de données
CREATE DATABASE IF NOT EXISTS coworkmy CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE coworkmy;

-- =====================================================
-- TABLE PROFILES (Profils utilisateurs)
-- =====================================================
CREATE TABLE IF NOT EXISTS profiles (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    avatar_url TEXT,
    phone VARCHAR(20),
    company VARCHAR(255),
    position VARCHAR(255),
    bio TEXT,
    website VARCHAR(255),
    social_links JSON,
    preferences JSON,
    is_admin BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_email (email),
    INDEX idx_is_admin (is_admin)
);

-- =====================================================
-- TABLE SPACES (Espaces de coworking)
-- =====================================================
CREATE TABLE IF NOT EXISTS spaces (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    postal_code VARCHAR(10) NOT NULL,
    country VARCHAR(100) DEFAULT 'France',
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    capacity INT DEFAULT 0,
    amenities JSON,
    images JSON,
    pricing JSON,
    opening_hours JSON,
    contact_info JSON,
    owner_id VARCHAR(36) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    rating DECIMAL(3, 2) DEFAULT 0.00,
    review_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_owner_id (owner_id),
    INDEX idx_city (city),
    INDEX idx_is_active (is_active),
    INDEX idx_is_featured (is_featured),
    INDEX idx_location (latitude, longitude),
    FOREIGN KEY (owner_id) REFERENCES profiles(id) ON DELETE CASCADE
);

-- =====================================================
-- TABLE BOOKINGS (Réservations)
-- =====================================================
CREATE TABLE IF NOT EXISTS bookings (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    space_id VARCHAR(36) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    total_hours DECIMAL(5, 2) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    status ENUM('pending', 'confirmed', 'cancelled', 'completed') DEFAULT 'pending',
    payment_status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
    payment_intent_id VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_space_id (space_id),
    INDEX idx_dates (start_date, end_date),
    INDEX idx_status (status),
    INDEX idx_payment_status (payment_status),
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (space_id) REFERENCES spaces(id) ON DELETE CASCADE
);

-- =====================================================
-- TABLE PAYMENTS (Paiements)
-- =====================================================
CREATE TABLE IF NOT EXISTS payments (
    id VARCHAR(36) PRIMARY KEY,
    booking_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'EUR',
    payment_method VARCHAR(50),
    stripe_payment_intent_id VARCHAR(255),
    stripe_customer_id VARCHAR(255),
    status ENUM('pending', 'succeeded', 'failed', 'cancelled') DEFAULT 'pending',
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_booking_id (booking_id),
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_stripe_payment_intent (stripe_payment_intent_id),
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
);

-- =====================================================
-- TABLE REVIEWS (Avis)
-- =====================================================
CREATE TABLE IF NOT EXISTS reviews (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    space_id VARCHAR(36) NOT NULL,
    booking_id VARCHAR(36),
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_space_id (space_id),
    INDEX idx_booking_id (booking_id),
    INDEX idx_rating (rating),
    UNIQUE KEY unique_user_space_review (user_id, space_id),
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (space_id) REFERENCES spaces(id) ON DELETE CASCADE,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL
);

-- =====================================================
-- TABLE NOTIFICATIONS (Notifications)
-- =====================================================
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('info', 'success', 'warning', 'error') DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    data JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_is_read (is_read),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
);

-- =====================================================
-- TABLE SUPPORT_TICKETS (Tickets de support)
-- =====================================================
CREATE TABLE IF NOT EXISTS support_tickets (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    status ENUM('open', 'in_progress', 'resolved', 'closed') DEFAULT 'open',
    category VARCHAR(100),
    assigned_to VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_priority (priority),
    INDEX idx_assigned_to (assigned_to),
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES profiles(id) ON DELETE SET NULL
);

-- =====================================================
-- TABLE SUPPORT_MESSAGES (Messages de support)
-- =====================================================
CREATE TABLE IF NOT EXISTS support_messages (
    id VARCHAR(36) PRIMARY KEY,
    ticket_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    message TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT FALSE,
    attachments JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_ticket_id (ticket_id),
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (ticket_id) REFERENCES support_tickets(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
);

-- =====================================================
-- TABLE FAQ (Questions fréquentes)
-- =====================================================
CREATE TABLE IF NOT EXISTS faq (
    id VARCHAR(36) PRIMARY KEY,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    category VARCHAR(100),
    order_index INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_order_index (order_index),
    INDEX idx_is_active (is_active)
);

-- =====================================================
-- TABLE AUDIT_LOGS (Logs d'audit)
-- =====================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36),
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(100),
    record_id VARCHAR(36),
    old_values JSON,
    new_values JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_action (action),
    INDEX idx_table_name (table_name),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL
);

-- =====================================================
-- TRIGGERS POUR MISE À JOUR AUTOMATIQUE
-- =====================================================

-- Trigger pour mettre à jour updated_at automatiquement
DELIMITER //
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    SET NEW.updated_at = CURRENT_TIMESTAMP;
//

CREATE TRIGGER update_spaces_updated_at
    BEFORE UPDATE ON spaces
    FOR EACH ROW
    SET NEW.updated_at = CURRENT_TIMESTAMP;
//

CREATE TRIGGER update_bookings_updated_at
    BEFORE UPDATE ON bookings
    FOR EACH ROW
    SET NEW.updated_at = CURRENT_TIMESTAMP;
//

CREATE TRIGGER update_payments_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW
    SET NEW.updated_at = CURRENT_TIMESTAMP;
//

CREATE TRIGGER update_reviews_updated_at
    BEFORE UPDATE ON reviews
    FOR EACH ROW
    SET NEW.updated_at = CURRENT_TIMESTAMP;
//

CREATE TRIGGER update_support_tickets_updated_at
    BEFORE UPDATE ON support_tickets
    FOR EACH ROW
    SET NEW.updated_at = CURRENT_TIMESTAMP;
//

CREATE TRIGGER update_faq_updated_at
    BEFORE UPDATE ON faq
    FOR EACH ROW
    SET NEW.updated_at = CURRENT_TIMESTAMP;
//

-- Trigger pour mettre à jour les statistiques des espaces
CREATE TRIGGER update_space_stats_after_review
    AFTER INSERT ON reviews
    FOR EACH ROW
BEGIN
    UPDATE spaces 
    SET rating = (
        SELECT AVG(rating) 
        FROM reviews 
        WHERE space_id = NEW.space_id
    ),
    review_count = (
        SELECT COUNT(*) 
        FROM reviews 
        WHERE space_id = NEW.space_id
    )
    WHERE id = NEW.space_id;
END;
//

DELIMITER ;

-- =====================================================
-- DONNÉES INITIALES
-- =====================================================

-- Insertion d'un utilisateur admin par défaut
INSERT INTO profiles (id, user_id, email, full_name, is_admin, is_verified) 
VALUES (
    UUID(),
    'admin-user-id',
    'admin@coworkmy.fr',
    'Administrateur CoWorkMy',
    TRUE,
    TRUE
) ON DUPLICATE KEY UPDATE is_admin = TRUE;

-- Insertion de questions FAQ par défaut
INSERT INTO faq (id, question, answer, category, order_index) VALUES
(UUID(), 'Comment réserver un espace de coworking ?', 'Vous pouvez réserver un espace en vous connectant à votre compte et en sélectionnant l\'espace souhaité dans notre catalogue.', 'Réservations', 1),
(UUID(), 'Quels sont les moyens de paiement acceptés ?', 'Nous acceptons les cartes bancaires, PayPal et les virements bancaires pour le paiement de vos réservations.', 'Paiements', 2),
(UUID(), 'Puis-je annuler ma réservation ?', 'Oui, vous pouvez annuler votre réservation jusqu\'à 24h avant le début de votre créneau réservé.', 'Réservations', 3),
(UUID(), 'Comment contacter le support client ?', 'Vous pouvez nous contacter via le chat en ligne, par email à support@coworkmy.fr ou en créant un ticket de support.', 'Support', 4);

-- =====================================================
-- INDEX OPTIMISATION
-- =====================================================

-- Index composites pour améliorer les performances
CREATE INDEX idx_bookings_user_date ON bookings(user_id, start_date, end_date);
CREATE INDEX idx_bookings_space_date ON bookings(space_id, start_date, end_date);
CREATE INDEX idx_payments_booking_status ON payments(booking_id, status);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, is_read);
CREATE INDEX idx_support_tickets_user_status ON support_tickets(user_id, status);
CREATE INDEX idx_support_messages_ticket_time ON support_messages(ticket_id, created_at);

-- =====================================================
-- VUES UTILES
-- =====================================================

-- Vue pour les statistiques des espaces
CREATE VIEW space_stats AS
SELECT 
    s.id,
    s.name,
    s.city,
    s.rating,
    s.review_count,
    COUNT(b.id) as total_bookings,
    COUNT(CASE WHEN b.status = 'completed' THEN 1 END) as completed_bookings,
    AVG(b.total_price) as avg_booking_price
FROM spaces s
LEFT JOIN bookings b ON s.id = b.space_id
GROUP BY s.id, s.name, s.city, s.rating, s.review_count;

-- Vue pour les statistiques utilisateur
CREATE VIEW user_stats AS
SELECT 
    p.id,
    p.full_name,
    p.email,
    COUNT(b.id) as total_bookings,
    COUNT(CASE WHEN b.status = 'completed' THEN 1 END) as completed_bookings,
    SUM(CASE WHEN b.status = 'completed' THEN b.total_price ELSE 0 END) as total_spent,
    COUNT(r.id) as total_reviews
FROM profiles p
LEFT JOIN bookings b ON p.id = b.user_id
LEFT JOIN reviews r ON p.id = r.user_id
GROUP BY p.id, p.full_name, p.email;

-- =====================================================
-- FIN DU SCHÉMA
-- =====================================================

-- Affichage des tables créées
SHOW TABLES;

-- Affichage des vues créées
SHOW FULL TABLES WHERE Table_type = 'VIEW';

-- Affichage des triggers créés
SHOW TRIGGERS;
