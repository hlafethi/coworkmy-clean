-- Migration des anciens messages sans session_id
UPDATE support_chat_messages
SET session_id = (
  SELECT id FROM support_chat_sessions
  WHERE support_chat_sessions.user_id::text = support_chat_messages.user_id
  ORDER BY created_at ASC LIMIT 1
)
WHERE session_id IS NULL; 