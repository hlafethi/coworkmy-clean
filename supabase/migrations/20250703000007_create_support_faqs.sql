-- Création de la table support_faqs
CREATE TABLE IF NOT EXISTS public.support_faqs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- RLS pour support_faqs
ALTER TABLE public.support_faqs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tout le monde peut voir les FAQ." ON public.support_faqs FOR SELECT USING (true);
CREATE POLICY "Les administrateurs peuvent tout gérer sur les FAQ." ON public.support_faqs FOR ALL USING (public.is_admin()); 