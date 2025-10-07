// Déclaration globale pour la configuration de l'application
declare global {
  interface Window {
    APP_CONFIG?: {
      API_URL: string;
    };
  }
}

export {};
