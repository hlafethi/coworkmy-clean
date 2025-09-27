-- Créer le bucket pour les avatars
-- Note: Les politiques RLS doivent être créées via l'interface Supabase
-- car elles nécessitent des permissions spéciales

-- Vérifier si le bucket existe déjà
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM storage.buckets WHERE id = 'avatars'
    ) THEN
        -- Créer le bucket seulement s'il n'existe pas
        INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
        VALUES (
            'avatars',
            'avatars',
            true, -- Bucket public pour faciliter l'affichage
            5242880, -- 5MB max
            ARRAY[
                'image/jpeg',
                'image/jpg', 
                'image/png',
                'image/webp'
            ]
        );
    ELSE
        -- Mettre à jour le bucket existant
        UPDATE storage.buckets
        SET 
            public = true,
            file_size_limit = 5242880,
            allowed_mime_types = ARRAY[
                'image/jpeg',
                'image/jpg', 
                'image/png',
                'image/webp'
            ]
        WHERE id = 'avatars';
    END IF;
END $$;

-- Note: Les politiques RLS suivantes doivent être créées via l'interface Supabase
-- car elles nécessitent des permissions spéciales

/*
1. Politique pour l'upload d'avatar (utilisateurs authentifiés)
CREATE POLICY "Users can upload their own avatar" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
  AND name ~ ('^' || auth.uid()::text || '_')
);

2. Politique pour la lecture des avatars (public)
CREATE POLICY "Anyone can view avatars" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

3. Politique pour la suppression d'avatar
CREATE POLICY "Users can delete their own avatar" ON storage.objects
FOR DELETE USING (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
  AND name ~ ('^' || auth.uid()::text || '_')
);

4. Politique pour la mise à jour d'avatar
CREATE POLICY "Users can update their own avatar" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
  AND name ~ ('^' || auth.uid()::text || '_')
);
*/ 