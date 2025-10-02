-- Script pour corriger la table profile_documents
-- Ajouter la colonne document_type si elle n'existe pas

-- Vérifier si la colonne existe et l'ajouter si nécessaire
DO $$
BEGIN
    -- Vérifier si la colonne document_type existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'profile_documents' 
        AND column_name = 'document_type'
    ) THEN
        -- Ajouter la colonne document_type
        ALTER TABLE profile_documents 
        ADD COLUMN document_type VARCHAR(50) DEFAULT 'other';
        
        RAISE NOTICE 'Colonne document_type ajoutée à la table profile_documents';
    ELSE
        RAISE NOTICE 'Colonne document_type existe déjà';
    END IF;
END $$;

-- Mettre à jour les documents existants qui ont document_type NULL
UPDATE profile_documents 
SET document_type = 'other' 
WHERE document_type IS NULL;

-- Vérifier la structure de la table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'profile_documents'
ORDER BY ordinal_position;

-- Vérifier les données
SELECT id, file_name, document_type, upload_date
FROM profile_documents
ORDER BY upload_date DESC
LIMIT 5;
