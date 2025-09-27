import { useState, useEffect } from 'react';
import { CookieSettings } from '@/components/common/CookieConsent';

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

  useEffect(() => {
    try {
      const storedConsent = localStorage.getItem(COOKIE_CONSENT_KEY);
      const storedPreferences = localStorage.getItem(COOKIE_PREFERENCES_KEY);

      setCookieConsent(storedConsent === 'true');
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
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to save cookie preferences'));
    }
  };

  const updateCookiePreferences = async (preferences: Partial<CookieSettings>) => {
    try {
      const updatedPreferences = { ...cookiePreferences, ...preferences };
      localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(updatedPreferences));
      setCookiePreferences(updatedPreferences);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update cookie preferences'));
    }
  };

  return {
    cookieConsent,
    cookiePreferences,
    loading,
    error,
    acceptCookies,
    declineCookies,
    updateCookiePreferences,
  };
}
