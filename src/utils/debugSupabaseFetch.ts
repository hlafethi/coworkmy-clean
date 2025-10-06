import { logger } from '@/utils/logger';
export async function debugSupabaseFetch(endpoint = '/rest/v1/users') {
  try {
    const response = await fetch(endpoint);
    const text = await response.text();
    logger.debug('Réponse brute :', text);
    if (text.includes('<!DOCTYPE')) {
      logger.error('Le serveur renvoie du HTML au lieu de JSON');
    } else {
      try {
        const json = JSON.parse(text);
        logger.debug('Réponse JSON valide :', json);
      } catch {
        logger.warn('Réponse non-JSON mais pas du HTML');
      }
    }
  } catch (err) {
    logger.error('Erreur lors du fetch debug :', err);
  }
} 