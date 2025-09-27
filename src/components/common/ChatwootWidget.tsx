import { useEffect, useRef } from 'react';

// Composant Chatwoot avec gestion d'erreur et fallback
export const ChatwootWidget = () => {
  const widgetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Vérifier si Chatwoot est déjà chargé
    if (window.ChatwootWidget) {
      try {
        window.ChatwootWidget.init({
          websiteToken: 'YOUR_WEBSITE_TOKEN', // Remplace par ton token
          baseUrl: 'https://app.chatwoot.com',
          launcherTitle: 'Support',
          locale: 'fr',
          position: 'right',
          type: 'standard'
        });
      } catch (error) {
        console.warn('Erreur Chatwoot:', error);
        createFallbackButton();
      }
    } else {
      // Fallback si Chatwoot n'est pas disponible
      createFallbackButton();
    }

    function createFallbackButton() {
      if (widgetRef.current) {
        widgetRef.current.innerHTML = `
          <button 
            onclick="window.open('https://app.chatwoot.com/widget', '_blank')"
            style="
              position: fixed;
              bottom: 20px;
              right: 20px;
              z-index: 1000;
              background: #007bff;
              color: white;
              border: none;
              border-radius: 50%;
              width: 60px;
              height: 60px;
              cursor: pointer;
              box-shadow: 0 2px 10px rgba(0,0,0,0.2);
              font-size: 24px;
            "
            title="Support"
          >
            💬
          </button>
        `;
      }
    }

    return () => {
      // Nettoyer si nécessaire
    };
  }, []);

  return <div ref={widgetRef} />;
};

export default ChatwootWidget;
