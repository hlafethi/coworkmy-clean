// src/main.tsx  (ou index.tsx)

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './styles/accessibility-fixes.css'
import './styles/contrast-fix.css'
import './styles/accessibility-final.css'
import './service-worker-registration'

// Autres initialisations
// import { initMonitoring } from './utils/monitoring';
import { initAnalytics } from './utils/analytics';
// import { initAccessibilityTesting } from './utils/accessibility'; // Temporairement désactivé

// initMonitoring();
initAnalytics();
// initAccessibilityTesting(); // Temporairement désactivé

// Vérification automatique des variables d'environnement critiques
const missingVars: string[] = [];
if (!import.meta.env.VITE_SUPABASE_URL) missingVars.push('VITE_SUPABASE_URL');
if (!import.meta.env.VITE_SUPABASE_ANON_KEY) missingVars.push('VITE_SUPABASE_ANON_KEY');
if (!import.meta.env.VITE_GOOGLE_MAPS_API_KEY) missingVars.push('VITE_GOOGLE_MAPS_API_KEY');

if (missingVars.length > 0) {
  const msg = `Erreur de configuration : variable(s) d'environnement manquante(s) : ${missingVars.join(', ')}.\n\nVérifiez votre fichier .env.local à la racine du projet.`;
  // Affiche dans la console
  console.error(msg);
  // Affiche dans le DOM
  const errorDiv = document.createElement('div');
  errorDiv.style.background = '#b00020';
  errorDiv.style.color = '#fff';
  errorDiv.style.padding = '24px';
  errorDiv.style.fontWeight = 'bold';
  errorDiv.style.fontSize = '1.2rem';
  errorDiv.style.borderRadius = '8px';
  errorDiv.style.margin = '32px auto';
  errorDiv.style.maxWidth = '600px';
  errorDiv.style.textAlign = 'center';
  errorDiv.innerText = msg;
  document.body.innerHTML = '';
  document.body.appendChild(errorDiv);
  throw new Error(msg);
}

// Render React root
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
