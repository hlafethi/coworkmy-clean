import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useCookieConsent } from '@/hooks/useCookieConsent';
import { CookieSettings } from '@/types/cookies';

export function CookieConsent() {
  const { 
    acceptCookies, 
    declineCookies, 
    updateCookiePreferences,
    cookiePreferences,
    showBanner,
    loading
  } = useCookieConsent();
  
  const [showSettings, setShowSettings] = useState(false);
  const safeElementRef = useRef<HTMLDivElement>(null);

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
  if (loading) {
    return null;
  }

  return (
    <>
      <div hidden ref={safeElementRef} tabIndex={-1} aria-hidden="true" />
      
      {showBanner && (
        <div 
          id="cookie-consent"
          className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 z-50"
        >
          <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-2">Gestion des cookies</h3>
              <p className="text-sm text-muted-foreground">
                Nous utilisons des cookies pour améliorer votre expérience.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowSettings(true)}
              >
                Personnaliser
              </Button>
              <Button 
                variant="outline" 
                onClick={handleRejectAll}
              >
                Refuser
              </Button>
              <Button onClick={handleAcceptAll}>
                Accepter
              </Button>
            </div>
          </div>
        </div>
      )}

      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Préférences de cookies</DialogTitle>
            <DialogDescription>
              Personnalisez vos préférences en matière de cookies
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="necessary">Cookies essentiels</Label>
              <Switch
                id="necessary"
                checked={cookiePreferences.necessary}
                disabled
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="analytics">Analytiques</Label>
              <Switch
                id="analytics"
                checked={cookiePreferences.analytics}
                onCheckedChange={(checked) =>
                  updateCookiePreferences({ ...cookiePreferences, analytics: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="marketing">Marketing</Label>
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
            <Button variant="outline" onClick={() => setShowSettings(false)}>
              Annuler
            </Button>
            <Button onClick={handleSaveSettings}>
              Enregistrer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
