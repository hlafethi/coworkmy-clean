// Script de test pour vérifier les paramètres de cookies
const fetch = require('node-fetch');

const API_BASE = 'http://localhost:5000';

async function testCookieSettings() {
  try {
    console.log('🧪 Test des paramètres de cookies...');
    
    // 1. Tester la récupération des paramètres
    console.log('\n1. Récupération des paramètres cookies...');
    const getResponse = await fetch(`${API_BASE}/api/cookie-settings`);
    const getData = await getResponse.json();
    
    if (getData.success) {
      console.log('✅ Paramètres récupérés:', getData.data);
    } else {
      console.log('❌ Erreur récupération:', getData.error);
    }
    
    // 2. Tester la sauvegarde des paramètres (nécessite un token admin)
    console.log('\n2. Test de sauvegarde des paramètres...');
    const testSettings = {
      title: 'Test Paramètres Cookies',
      description: 'Test de description',
      accept_button_text: 'Accepter Test',
      reject_button_text: 'Refuser Test',
      settings_button_text: 'Paramètres Test',
      save_preferences_text: 'Sauvegarder Test',
      necessary_cookies_title: 'Cookies Essentiels Test',
      necessary_cookies_description: 'Description test',
      analytics_cookies_title: 'Analytiques Test',
      analytics_cookies_description: 'Description analytiques test',
      analytics_cookies_enabled: true,
      marketing_cookies_title: 'Marketing Test',
      marketing_cookies_description: 'Description marketing test',
      marketing_cookies_enabled: false,
      privacy_policy_url: '/test-privacy',
      cookie_policy_url: '/test-cookies',
      is_active: true,
      banner_position: 'top',
      banner_layout: 'modal',
      primary_color: '#FF6B6B',
      secondary_color: '#4ECDC4',
      background_color: '#F7F7F7',
      text_color: '#2C3E50'
    };
    
    // Note: Ce test nécessiterait un token d'authentification admin
    console.log('📝 Paramètres de test préparés:', testSettings);
    console.log('ℹ️  Pour tester la sauvegarde, il faut être authentifié en tant qu\'admin');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  }
}

// Exécuter le test
testCookieSettings();
