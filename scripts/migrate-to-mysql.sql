-- Migration MySQL - Script complet
-- Exécute ce script dans phpMyAdmin ou via la ligne de commande MySQL

-- 1. Création de la base de données
CREATE DATABASE IF NOT EXISTS `sc2rafi0640_coworkmy` 
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE `sc2rafi0640_coworkmy`;

-- 2. Table profiles
CREATE TABLE IF NOT EXISTS `profiles` (
    `id` CHAR(36) PRIMARY KEY,
    `email` VARCHAR(255) UNIQUE NOT NULL,
    `full_name` VARCHAR(255),
    `avatar_url` TEXT,
    `phone` VARCHAR(20),
    `company` VARCHAR(255),
    `role` ENUM('user', 'admin') DEFAULT 'user',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Table spaces
CREATE TABLE IF NOT EXISTS `spaces` (
    `id` CHAR(36) PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT,
    `capacity` INT NOT NULL,
    `price_per_hour` DECIMAL(10,2) NOT NULL,
    `image_url` TEXT,
    `is_active` BOOLEAN DEFAULT TRUE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Table bookings
CREATE TABLE IF NOT EXISTS `bookings` (
    `id` CHAR(36) PRIMARY KEY,
    `user_id` CHAR(36) NOT NULL,
    `space_id` CHAR(36) NOT NULL,
    `start_time` DATETIME NOT NULL,
    `end_time` DATETIME NOT NULL,
    `total_price` DECIMAL(10,2) NOT NULL,
    `status` ENUM('pending', 'confirmed', 'cancelled', 'completed') DEFAULT 'pending',
    `notes` TEXT,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `profiles`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`space_id`) REFERENCES `spaces`(`id`) ON DELETE CASCADE,
    CONSTRAINT `check_booking_duration` CHECK (`end_time` > `start_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Table payments
CREATE TABLE IF NOT EXISTS `payments` (
    `id` CHAR(36) PRIMARY KEY,
    `booking_id` CHAR(36) NOT NULL,
    `stripe_session_id` VARCHAR(255),
    `stripe_payment_intent_id` VARCHAR(255),
    `amount` DECIMAL(10,2) NOT NULL,
    `currency` VARCHAR(3) DEFAULT 'EUR',
    `status` ENUM('pending', 'succeeded', 'failed', 'refunded') DEFAULT 'pending',
    `mode` ENUM('test', 'live') DEFAULT 'test',
    `user_email` VARCHAR(255) NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Table admin_settings
CREATE TABLE IF NOT EXISTS `admin_settings` (
    `id` CHAR(36) PRIMARY KEY,
    `key` VARCHAR(255) UNIQUE NOT NULL,
    `value` JSON NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Table time_slots
CREATE TABLE IF NOT EXISTS `time_slots` (
    `id` CHAR(36) PRIMARY KEY,
    `space_id` CHAR(36) NOT NULL,
    `day_of_week` TINYINT NOT NULL CHECK (`day_of_week` >= 0 AND `day_of_week` <= 6),
    `start_time` TIME NOT NULL,
    `end_time` TIME NOT NULL,
    `is_available` BOOLEAN DEFAULT TRUE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`space_id`) REFERENCES `spaces`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Table support_messages
CREATE TABLE IF NOT EXISTS `support_messages` (
    `id` CHAR(36) PRIMARY KEY,
    `user_id` CHAR(36) NOT NULL,
    `subject` VARCHAR(255) NOT NULL,
    `message` TEXT NOT NULL,
    `status` VARCHAR(50) DEFAULT 'open',
    `admin_response` TEXT,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `profiles`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Table support_chat_sessions
CREATE TABLE IF NOT EXISTS `support_chat_sessions` (
    `id` CHAR(36) PRIMARY KEY,
    `user_id` CHAR(36) NOT NULL,
    `session_id` VARCHAR(255) UNIQUE NOT NULL,
    `status` VARCHAR(50) DEFAULT 'active',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `profiles`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Index pour les performances
CREATE INDEX `idx_bookings_user_id` ON `bookings`(`user_id`);
CREATE INDEX `idx_bookings_space_id` ON `bookings`(`space_id`);
CREATE INDEX `idx_bookings_start_time` ON `bookings`(`start_time`);
CREATE INDEX `idx_bookings_end_time` ON `bookings`(`end_time`);
CREATE INDEX `idx_payments_booking_id` ON `payments`(`booking_id`);
CREATE INDEX `idx_payments_stripe_session_id` ON `payments`(`stripe_session_id`);
CREATE INDEX `idx_payments_user_email` ON `payments`(`user_email`);
CREATE INDEX `idx_time_slots_space_id` ON `time_slots`(`space_id`);
CREATE INDEX `idx_support_messages_user_id` ON `support_messages`(`user_id`);
CREATE INDEX `idx_support_chat_sessions_user_id` ON `support_chat_sessions`(`user_id`);

-- 11. Fonction pour générer des UUIDs
DELIMITER //
CREATE FUNCTION IF NOT EXISTS `generate_uuid`() 
RETURNS CHAR(36)
READS SQL DATA
DETERMINISTIC
BEGIN
    RETURN UUID();
END //
DELIMITER ;

-- 12. Trigger pour générer automatiquement les UUIDs
DELIMITER //
CREATE TRIGGER IF NOT EXISTS `profiles_before_insert` 
BEFORE INSERT ON `profiles` 
FOR EACH ROW 
BEGIN
    IF NEW.id IS NULL THEN
        SET NEW.id = generate_uuid();
    END IF;
END //

CREATE TRIGGER IF NOT EXISTS `spaces_before_insert` 
BEFORE INSERT ON `spaces` 
FOR EACH ROW 
BEGIN
    IF NEW.id IS NULL THEN
        SET NEW.id = generate_uuid();
    END IF;
END //

CREATE TRIGGER IF NOT EXISTS `bookings_before_insert` 
BEFORE INSERT ON `bookings` 
FOR EACH ROW 
BEGIN
    IF NEW.id IS NULL THEN
        SET NEW.id = generate_uuid();
    END IF;
END //

CREATE TRIGGER IF NOT EXISTS `payments_before_insert` 
BEFORE INSERT ON `payments` 
FOR EACH ROW 
BEGIN
    IF NEW.id IS NULL THEN
        SET NEW.id = generate_uuid();
    END IF;
END //

CREATE TRIGGER IF NOT EXISTS `admin_settings_before_insert` 
BEFORE INSERT ON `admin_settings` 
FOR EACH ROW 
BEGIN
    IF NEW.id IS NULL THEN
        SET NEW.id = generate_uuid();
    END IF;
END //

CREATE TRIGGER IF NOT EXISTS `time_slots_before_insert` 
BEFORE INSERT ON `time_slots` 
FOR EACH ROW 
BEGIN
    IF NEW.id IS NULL THEN
        SET NEW.id = generate_uuid();
    END IF;
END //

CREATE TRIGGER IF NOT EXISTS `support_messages_before_insert` 
BEFORE INSERT ON `support_messages` 
FOR EACH ROW 
BEGIN
    IF NEW.id IS NULL THEN
        SET NEW.id = generate_uuid();
    END IF;
END //

CREATE TRIGGER IF NOT EXISTS `support_chat_sessions_before_insert` 
BEFORE INSERT ON `support_chat_sessions` 
FOR EACH ROW 
BEGIN
    IF NEW.id IS NULL THEN
        SET NEW.id = generate_uuid();
    END IF;
END //
DELIMITER ;

-- 13. Données de base
INSERT INTO `admin_settings` (`key`, `value`) VALUES 
('stripe', '{"mode": "test", "test_secret_key": "", "test_publishable_key": "", "live_secret_key": "", "live_publishable_key": ""}'),
('email', '{"smtp_host": "", "smtp_port": 587, "smtp_user": "", "smtp_pass": "", "from_email": ""}'),
('general', '{"site_name": "Canard Cowork Space", "contact_email": "contact@canard-cowork.space"}')
ON DUPLICATE KEY UPDATE `value` = VALUES(`value`);

-- 14. Utilisateur admin par défaut
INSERT INTO `profiles` (`email`, `full_name`, `role`) VALUES 
('admin@canard-cowork.space', 'Administrateur', 'admin')
ON DUPLICATE KEY UPDATE `full_name` = VALUES(`full_name`), `role` = VALUES(`role`);

-- 15. Espaces de test
INSERT INTO `spaces` (`name`, `description`, `capacity`, `price_per_hour`) VALUES 
('Bureau Privé 1', 'Bureau privé avec vue sur la ville', 1, 15.00),
('Salle de Réunion A', 'Salle de réunion pour 6 personnes', 6, 25.00),
('Espace Coworking', 'Espace de travail partagé', 10, 8.00)
ON DUPLICATE KEY UPDATE 
    `description` = VALUES(`description`),
    `capacity` = VALUES(`capacity`),
    `price_per_hour` = VALUES(`price_per_hour`);

-- 16. Vue pour les résumés de réservation
CREATE OR REPLACE VIEW `booking_summary` AS
SELECT 
    b.id,
    b.user_id,
    p.full_name as user_name,
    p.email as user_email,
    s.name as space_name,
    b.start_time,
    b.end_time,
    b.total_price,
    b.status,
    b.created_at
FROM bookings b
JOIN profiles p ON b.user_id = p.id
JOIN spaces s ON b.space_id = s.id;

-- Fin de la migration
SELECT 'Migration MySQL terminée avec succès !' as message; 