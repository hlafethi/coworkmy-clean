-- Insert test products
INSERT INTO public.products (name, description, image_url, price)
VALUES 
    -- Espaces de travail
    ('Espace de travail - Journée', 'Accès à l''espace de travail pour une journée complète', 'https://example.com/day-pass.jpg', 25.00),
    ('Espace de travail - Semaine', 'Accès à l''espace de travail pour une semaine complète', 'https://example.com/week-pass.jpg', 120.00),
    ('Espace de travail - Mois', 'Accès à l''espace de travail pour un mois complet', 'https://example.com/month-pass.jpg', 400.00),
    ('Espace de travail - 3 Mois', 'Accès à l''espace de travail pour 3 mois avec réduction', 'https://example.com/3months-pass.jpg', 1100.00),
    ('Espace de travail - 6 Mois', 'Accès à l''espace de travail pour 6 mois avec réduction', 'https://example.com/6months-pass.jpg', 2000.00),
    ('Espace de travail - Année', 'Accès à l''espace de travail pour une année complète avec réduction maximale', 'https://example.com/year-pass.jpg', 3600.00),

    -- Salles de réunion
    ('Salle de réunion - 2h', 'Location d''une salle de réunion pour 2 heures', 'https://example.com/meeting-room-2h.jpg', 50.00),
    ('Salle de réunion - 4h', 'Location d''une salle de réunion pour 4 heures', 'https://example.com/meeting-room-4h.jpg', 90.00),
    ('Salle de réunion - Journée', 'Location d''une salle de réunion pour une journée complète', 'https://example.com/meeting-room-day.jpg', 180.00),
    ('Salle de réunion - Semaine', 'Location d''une salle de réunion pour une semaine complète', 'https://example.com/meeting-room-week.jpg', 800.00),

    -- Bureaux dédiés
    ('Bureau dédié - Mois', 'Location d''un bureau dédié pour un mois', 'https://example.com/dedicated-desk-month.jpg', 600.00),
    ('Bureau dédié - 3 Mois', 'Location d''un bureau dédié pour 3 mois avec réduction', 'https://example.com/dedicated-desk-3months.jpg', 1650.00),
    ('Bureau dédié - 6 Mois', 'Location d''un bureau dédié pour 6 mois avec réduction', 'https://example.com/dedicated-desk-6months.jpg', 3000.00),
    ('Bureau dédié - Année', 'Location d''un bureau dédié pour une année avec réduction maximale', 'https://example.com/dedicated-desk-year.jpg', 5400.00),

    -- Services additionnels
    ('Imprimante - 100 pages', 'Impression de 100 pages en noir et blanc', 'https://example.com/printer-100.jpg', 10.00),
    ('Imprimante - 500 pages', 'Impression de 500 pages en noir et blanc avec réduction', 'https://example.com/printer-500.jpg', 45.00),
    ('Parking - Mois', 'Place de parking dédiée pour un mois', 'https://example.com/parking-month.jpg', 100.00),
    ('Parking - Année', 'Place de parking dédiée pour une année avec réduction', 'https://example.com/parking-year.jpg', 1000.00),
    ('Formation - Initiation', 'Session de formation à l''utilisation des espaces', 'https://example.com/training.jpg', 50.00)
ON CONFLICT (id) DO NOTHING; 