-- Création de la table profile_documents
CREATE TABLE IF NOT EXISTS public.profile_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  document_url TEXT,
  file_name TEXT,
  file_size INTEGER,
  file_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- RLS pour profile_documents
ALTER TABLE public.profile_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Les utilisateurs peuvent voir leurs propres documents." ON public.profile_documents FOR SELECT USING (auth.uid() = profile_id);
CREATE POLICY "Les utilisateurs peuvent ajouter leurs propres documents." ON public.profile_documents FOR INSERT WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "Les utilisateurs peuvent supprimer leurs propres documents." ON public.profile_documents FOR DELETE USING (auth.uid() = profile_id);
CREATE POLICY "Les utilisateurs peuvent mettre à jour leurs propres documents." ON public.profile_documents FOR UPDATE USING (auth.uid() = profile_id);
-- Admin
CREATE POLICY "Les administrateurs peuvent tout gérer sur les documents." ON public.profile_documents FOR ALL USING (public.is_admin()); 