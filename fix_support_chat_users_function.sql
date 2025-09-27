-- Correction de la fonction get_support_chat_users pour supporter les guests et UUID
CREATE OR REPLACE FUNCTION get_support_chat_users()
RETURNS TABLE (
    user_id text,
    last_message text,
    last_date timestamptz,
    full_name text,
    email text,
    avatar_url text
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    RETURN QUERY
    WITH last_messages AS (
        SELECT DISTINCT ON (scm.user_id)
            scm.user_id,
            scm.message as last_message,
            scm.created_at as last_date
        FROM support_chat_messages scm
        ORDER BY scm.user_id, scm.created_at DESC
    )
    SELECT 
        lm.user_id,
        lm.last_message,
        lm.last_date,
        COALESCE(p.full_name, 'Invité') as full_name,
        p.email,
        p.avatar_url
    FROM last_messages lm
    LEFT JOIN profiles p ON
        (lm.user_id !~ '^support_guest_' AND p.id::text = lm.user_id)
    ORDER BY lm.last_date DESC;
END;
$$; 