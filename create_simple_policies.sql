-- Requêtes pour créer les 2 politiques simples
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Politique pour le bucket AVATARS (très permissive)
CREATE POLICY "avatars_simple" ON storage.objects
FOR ALL 
TO authenticated
USING (bucket_id = 'avatars')
WITH CHECK (bucket_id = 'avatars');

-- 2. Politique pour le bucket DOCUMENTS (très permissive)
CREATE POLICY "documents_simple" ON storage.objects
FOR ALL 
TO authenticated
USING (bucket_id = 'documents')
WITH CHECK (bucket_id = 'documents');

-- 3. Vérification des nouvelles politiques
SELECT 
    'POLITIQUES CRÉÉES:' as status,
    policyname,
    cmd
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects'
AND policyname IN ('avatars_simple', 'documents_simple')
ORDER BY policyname;

-- 4. Compter le total de politiques (devrait être 2)
SELECT 
    'TOTAL POLITIQUES:' as info,
    COUNT(*) as count
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects'
AND (policyname LIKE '%avatar%' OR policyname LIKE '%document%');

SELECT 'CONFIGURATION TERMINÉE - TESTEZ L''UPLOAD MAINTENANT!' as message; 