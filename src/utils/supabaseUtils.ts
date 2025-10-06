import { logger } from '@/utils/logger';
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 seconde

export async function withRetry<T>(
  operation: () => Promise<T>,
  retries = MAX_RETRIES,
  delay = RETRY_DELAY
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (retries > 0 && error instanceof Error && 
        (error.message.includes('ERR_INSUFFICIENT_RESOURCES') || 
         error.message.includes('Failed to fetch') ||
         error.message.includes('Invalid Refresh Token') ||
         error.message.includes('JWT expired'))) {
      
      logger.warn(`Retrying operation after error: ${error.message}. Retries left: ${retries}`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return withRetry(operation, retries - 1, delay * 2);
    }
    throw error;
  }
}

/**
 * Vérifie si un token d'authentification est expiré
 * @param token Le token JWT à vérifier
 * @returns true si le token est expiré, false sinon
 */
export function isTokenExpired(token: string): boolean {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    const { exp } = JSON.parse(jsonPayload);
    const expired = Date.now() >= exp * 1000;
    
    return expired;
  } catch (e) {
    logger.error('Error checking token expiration:', e);
    return true; // En cas d'erreur, considérer le token comme expiré
  }
}

/**
 * Vérifie que la réponse est bien du JSON, sinon affiche la réponse brute (utile pour debug proxy/API)
 */
export async function handleApiResponse(response: Response) {
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    const text = await response.text();
    logger.error('Réponse non JSON:', text);
    throw new Error('Réponse non JSON');
  }
  return response.json();
}
