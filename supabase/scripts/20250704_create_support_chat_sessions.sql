-- Table des sessions de chat support utilisateur
CREATE TABLE IF NOT EXISTS public.support_chat_sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    status text NOT NULL DEFAULT 'open',
    created_at timestamptz NOT NULL DEFAULT now(),
    closed_at timestamptz,
    rating integer,
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
);

-- Index pour accélérer les requêtes
CREATE INDEX IF NOT EXISTS idx_support_chat_sessions_user_id ON public.support_chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_support_chat_sessions_status ON public.support_chat_sessions(status); 