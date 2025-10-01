import { useState, useEffect } from 'react';
import { CookieSettings } from '@/types/cookies';

const COOKIE_CONSENT_KEY = 'cookie-consent';
const COOKIE_PREFERENCES_KEY = 'cookie-preferences';

const defaultPreferences: CookieSettings = {
  necessary: true,
  analytics: false,
  marketing: false,
};

export function useCookieConsent() {
  const [cookieConsent, setCookieConsent] = useState<boolean | null>(null);
  const [cookiePreferences, setCookiePreferences] = useState<CookieSettings>(defaultPreferences);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    try {
      const storedConsent = localStorage.getItem(COOKIE_CONSENT_KEY);
      const storedPreferences = localStorage.getItem(COOKIE_PREFERENCES_KEY);

      if (storedConsent !== null) {
        setCookieConsent(storedConsent === 'true');
        setShowBanner(false); // Ne pas afficher le banner si déjà décidé
      } else {
        setShowBanner(true); // Afficher le banner si pas encore décidé
      }
      
      if (storedPreferences) {
        setCookiePreferences(JSON.parse(storedPreferences));
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load cookie preferences'));
    } finally {
      setLoading(false);
    }
  }, []);

  const acceptCookies = () => {
    try {
      localStorage.setItem(COOKIE_CONSENT_KEY, 'true');
      setCookieConsent(true);
      setShowBanner(false);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to save cookie consent'));
    }
  };

  const declineCookies = () => {
    try {
      localStorage.setItem(COOKIE_CONSENT_KEY, 'false');
      setCookieConsent(false);
      setCookiePreferences(defaultPreferences);
      localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(defaultPreferences));
      setShowBanner(false);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to save cookie preferences'));
    }
  };

  const updateCookiePreferences = (preferences: Partial<CookieSettings>) => {
    try {
      const updatedPreferences = { ...cookiePreferences, ...preferences };
      localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(updatedPreferences));
      setCookiePreferences(updatedPreferences);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update cookie preferences'));
    }
  };

  const resetCookieConsent = () => {
    try {
      localStorage.removeItem(COOKIE_CONSENT_KEY);
      localStorage.removeItem(COOKIE_PREFERENCES_KEY);
      setCookieConsent(null);
      setCookiePreferences(defaultPreferences);
      setShowBanner(true);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to reset cookie consent'));
    }
  };

  return {
    cookieConsent,
    cookiePreferences,
    loading,
    error,
    showBanner,
    acceptCookies,
    declineCookies,
    updateCookiePreferences,
    resetCookieConsent,
  };
}
