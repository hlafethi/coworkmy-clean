-- Drop the existing function
DROP FUNCTION IF EXISTS get_support_chat_users();

-- Recreate the function with the correct syntax and fixed search_path
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
        CASE 
            WHEN lm.user_id LIKE 'support_guest_%' THEN 'Invité'
            ELSE p.full_name 
        END as full_name,
        CASE 
            WHEN lm.user_id LIKE 'support_guest_%' THEN NULL
            ELSE p.email 
        END as email,
        CASE 
            WHEN lm.user_id LIKE 'support_guest_%' THEN NULL
            ELSE p.avatar_url 
        END as avatar_url
    FROM last_messages lm
    LEFT JOIN profiles p ON p.id::text = lm.user_id
    ORDER BY lm.last_date DESC;
END;
$$;

-- Re-grant permissions
GRANT EXECUTE ON FUNCTION get_support_chat_users() TO authenticated;
GRANT EXECUTE ON FUNCTION get_support_chat_users() TO service_role;
GRANT EXECUTE ON FUNCTION get_support_chat_users() TO anon; 