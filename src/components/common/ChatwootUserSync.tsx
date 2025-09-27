import { useAuth } from '../../context/AuthContextNew';
import { useEffect } from 'react';

const ChatwootUserSync = () => {
  const { user, profile } = useAuth();
  useEffect(() => {
    if (window.$chatwoot && user) {
      window.$chatwoot.setUser(user.id, {
        email: user.email,
        name: profile?.full_name || user.email,
      });
    }
  }, [user, profile]);
  return null;
};

export default ChatwootUserSync; 