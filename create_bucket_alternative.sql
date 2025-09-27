-- Script alternatif pour créer le bucket de documents
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Créer le bucket (seulement si vous avez les permissions)
-- Si cette commande échoue, utilisez l'interface graphique
DO $$
BEGIN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
        'documents',
        'documents',
        false,
        10485760,
        ARRAY[
            'image/jpeg',
            'image/jpg', 
            'image/png',
            'image/webp',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/plain',
            'text/csv'
        ]
    );
EXCEPTION
    WHEN unique_violation THEN
        RAISE NOTICE 'Bucket documents existe déjà';
    WHEN insufficient_privilege THEN
        RAISE NOTICE 'Permissions insuffisantes - utilisez l''interface graphique';
END $$;

-- 2. Fonction pour créer les politiques RLS
-- Cette approche évite les problèmes de permissions
CREATE OR REPLACE FUNCTION create_documents_policies()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Politique pour l'upload
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Users can upload their own documents'
    ) THEN
        EXECUTE 'CREATE POLICY "Users can upload their own documents" ON storage.objects
        FOR INSERT WITH CHECK (
            bucket_id = ''documents'' 
            AND auth.uid()::text = (storage.foldername(name))[2]
            AND auth.role() = ''authenticated''
        )';
    END IF;

    -- Politique pour la lecture
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Users can view their own documents'
    ) THEN
        EXECUTE 'CREATE POLICY "Users can view their own documents" ON storage.objects
        FOR SELECT USING (
            bucket_id = ''documents'' 
            AND auth.uid()::text = (storage.foldername(name))[2]
            AND auth.role() = ''authenticated''
        )';
    END IF;

    -- Politique pour la suppression
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Users can delete their own documents'
    ) THEN
        EXECUTE 'CREATE POLICY "Users can delete their own documents" ON storage.objects
        FOR DELETE USING (
            bucket_id = ''documents'' 
            AND auth.uid()::text = (storage.foldername(name))[2]
            AND auth.role() = ''authenticated''
        )';
    END IF;

    -- Politique pour la mise à jour
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Users can update their own documents'
    ) THEN
        EXECUTE 'CREATE POLICY "Users can update their own documents" ON storage.objects
        FOR UPDATE USING (
            bucket_id = ''documents'' 
            AND auth.uid()::text = (storage.foldername(name))[2]
            AND auth.role() = ''authenticated''
        )';
    END IF;

    RAISE NOTICE 'Politiques RLS créées avec succès';
END;
$$;

-- 3. Exécuter la fonction pour créer les politiques
SELECT create_documents_policies();

-- 4. Nettoyer la fonction temporaire
DROP FUNCTION IF EXISTS create_documents_policies();

-- 5. Vérifier que les politiques ont été créées
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects' 
AND policyname LIKE '%documents%';

-- 6. Vérifier que le bucket existe
SELECT 
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets 
WHERE id = 'documents'; 