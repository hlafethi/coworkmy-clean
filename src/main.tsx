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
// Logger supprimé - utilisation de console directement
// import { initAccessibilityTesting } from './utils/accessibility'; // Temporairement désactivé

// initMonitoring();
initAnalytics();
// initAccessibilityTesting(); // Temporairement désactivé

// Configuration de l'application

// Render React root
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
