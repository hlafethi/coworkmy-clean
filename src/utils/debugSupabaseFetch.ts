// Logger supprimé - utilisation de console directement
export async function debugSupabaseFetch(endpoint = '/rest/v1/users') {
  try {
    const response = await fetch(endpoint);
    const text = await response.text();
    console.log('Réponse brute :', text);
    if (text.includes('<!DOCTYPE')) {
      console.error('Le serveur renvoie du HTML au lieu de JSON');
    } else {
      try {
        const json = JSON.parse(text);
        console.log('Réponse JSON valide :', json);
      } catch {
        console.warn('Réponse non-JSON mais pas du HTML');
      }
    }
  } catch (err) {
    console.error('Erreur lors du fetch debug :', err);
  }
} 