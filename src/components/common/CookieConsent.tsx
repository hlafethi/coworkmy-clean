import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useCookieConsent } from '@/hooks/useCookieConsent';
import { useCookieSettings } from '@/hooks/useCookieSettings';
import { CookieSettings } from '@/types/cookies';
// Logger supprimé - utilisation de console directement
export function CookieConsent() {
  const { 
    acceptCookies, 
    declineCookies, 
    updateCookiePreferences,
    cookiePreferences,
    showBanner,
    loading
  } = useCookieConsent();
  
  const { settings: cookieSettings, loading: settingsLoading, refetch: refetchSettings } = useCookieSettings();
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(0);
  
  const [showSettings, setShowSettings] = useState(false);
  const safeElementRef = useRef<HTMLDivElement>(null);

  // Écouter les événements de mise à jour des paramètres cookies
  useEffect(() => {
    const handleCookieSettingsUpdate = (e: CustomEvent) => {
      console.log('🔄 Mise à jour des paramètres cookies reçue');
      // Rafraîchir les paramètres immédiatement avec forceRefresh
      refetchSettings(true);
    };

    window.addEventListener('cookie-settings-updated', handleCookieSettingsUpdate as EventListener);
    return () => window.removeEventListener('cookie-settings-updated', handleCookieSettingsUpdate as EventListener);
  }, [refetchSettings]);

  const stabilizeSelection = () => {
    const sel = window.getSelection();
    if (sel) {
      sel.removeAllRanges();
      const range = document.createRange();
      const safeNode = safeElementRef.current || document.body;
      range.selectNode(safeNode);
      range.collapse(true);
      sel.addRange(range);
      sel.removeAllRanges();
    }
  };

  const handleRejectAll = () => {
    stabilizeSelection();
    declineCookies();
  };

  const handleAcceptAll = () => {
    acceptCookies();
  };

  const handleSaveSettings = () => {
    try {
      updateCookiePreferences(cookiePreferences);
      setShowSettings(false);
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
    }
  };

  // Ne pas afficher le composant pendant le chargement
  if (loading || settingsLoading) {
    return null;
  }

  // Styles dynamiques basés sur les paramètres cookies
  const bannerStyle = cookieSettings ? {
    backgroundColor: cookieSettings.background_color || '#ffffff',
    color: cookieSettings.text_color || '#000000',
    borderTop: `1px solid ${cookieSettings.primary_color || '#e5e7eb'}`,
  } : {};

  const buttonStyle = cookieSettings ? {
    backgroundColor: cookieSettings.primary_color || '#3b82f6',
    color: cookieSettings.text_color || '#ffffff',
  } : {};

  return (
    <>
      <div hidden ref={safeElementRef} tabIndex={-1} aria-hidden="true" />
      
      {showBanner && (
        <div 
          id="cookie-consent"
          className="fixed bottom-0 left-0 right-0 p-4 z-50"
          style={bannerStyle}
        >
          <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-2">
                {cookieSettings?.title || 'Gestion des cookies'}
              </h3>
              <p className="text-sm opacity-80">
                {cookieSettings?.description || 'Nous utilisons des cookies pour améliorer votre expérience.'}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowSettings(true)}
                style={{ borderColor: cookieSettings?.primary_color }}
              >
                {cookieSettings?.settings_button_text || 'Personnaliser'}
              </Button>
              <Button 
                variant="outline" 
                onClick={handleRejectAll}
                style={{ borderColor: cookieSettings?.primary_color }}
              >
                {cookieSettings?.reject_button_text || 'Refuser'}
              </Button>
              <Button 
                onClick={handleAcceptAll}
                style={buttonStyle}
              >
                {cookieSettings?.accept_button_text || 'Accepter'}
              </Button>
            </div>
          </div>
        </div>
      )}

      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent style={{ backgroundColor: cookieSettings?.background_color }}>
          <DialogHeader>
            <DialogTitle style={{ color: cookieSettings?.text_color }}>
              Préférences de cookies
            </DialogTitle>
            <DialogDescription style={{ color: cookieSettings?.text_color, opacity: 0.8 }}>
              Personnalisez vos préférences en matière de cookies
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="necessary" style={{ color: cookieSettings?.text_color }}>
                {cookieSettings?.necessary_cookies_title || 'Cookies essentiels'}
              </Label>
              <Switch
                id="necessary"
                checked={cookiePreferences.necessary}
                disabled
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="analytics" style={{ color: cookieSettings?.text_color }}>
                {cookieSettings?.analytics_cookies_title || 'Analytiques'}
              </Label>
              <Switch
                id="analytics"
                checked={cookiePreferences.analytics}
                onCheckedChange={(checked) =>
                  updateCookiePreferences({ ...cookiePreferences, analytics: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="marketing" style={{ color: cookieSettings?.text_color }}>
                {cookieSettings?.marketing_cookies_title || 'Marketing'}
              </Label>
              <Switch
                id="marketing"
                checked={cookiePreferences.marketing}
                onCheckedChange={(checked) =>
                  updateCookiePreferences({ ...cookiePreferences, marketing: checked })
                }
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowSettings(false)}
              style={{ borderColor: cookieSettings?.primary_color }}
            >
              Annuler
            </Button>
            <Button 
              onClick={handleSaveSettings}
              style={buttonStyle}
            >
              {cookieSettings?.save_preferences_text || 'Enregistrer'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
