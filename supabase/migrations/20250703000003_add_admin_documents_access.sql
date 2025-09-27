-- Migration pour permettre aux admins de voir les documents de tous les utilisateurs
-- Cette migration ajoute une politique RLS pour l'accès admin aux documents

-- Politique pour permettre aux admins de voir tous les documents
CREATE POLICY "Admins can view all documents" ON storage.objects
FOR SELECT USING (
  bucket_id = 'documents' 
  AND public.is_admin()
);

-- Politique pour permettre aux admins de télécharger tous les documents
CREATE POLICY "Admins can download all documents" ON storage.objects
FOR SELECT USING (
  bucket_id = 'documents' 
  AND public.is_admin()
);

-- Vérifier que les politiques ont été créées
SELECT 
    policyname,
    cmd
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects'
AND policyname LIKE '%admin%'
ORDER BY policyname; 