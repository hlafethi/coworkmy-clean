import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import { Palette, Settings, Save } from "lucide-react"; // 🔧 Suppression de 'Eye'

interface CookieSettings {
  id: string;
  title: string;
  description: string;
  accept_button_text: string;
  reject_button_text: string;
  settings_button_text: string;
  save_preferences_text: string;
  necessary_cookies_title: string;
  necessary_cookies_description: string;
  analytics_cookies_title: string;
  analytics_cookies_description: string;
  analytics_cookies_enabled: boolean;
  marketing_cookies_title: string;
  marketing_cookies_description: string;
  marketing_cookies_enabled: boolean;
  privacy_policy_url: string;
  cookie_policy_url: string;
  is_active: boolean;
  banner_position: 'top' | 'bottom';
  banner_layout: 'banner' | 'modal' | 'sidebar';
  primary_color: string;
  secondary_color: string;
  background_color: string;
  text_color: string;
  created_at: string;
  updated_at: string;
}

export const CookieSettingsAdmin = ({ isDisabled = false }: { isDisabled?: boolean }) => {
  const [settings, setSettings] = useState<CookieSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        console.log('🔄 Chargement des paramètres cookies...');
        
        const result = await apiClient.get('/cookie-settings');
        
        if (result.success && result.data) {
          console.log('✅ Paramètres cookies chargés:', result.data);
          setSettings(result.data);
        } else {
          console.log('📝 Aucun paramètre trouvé, utilisation des valeurs par défaut');
          setSettings({
            id: 'default',
            title: 'Paramètres de Cookies',
            description: 'Gérez vos préférences de cookies',
            accept_button_text: 'Accepter',
            reject_button_text: 'Refuser',
            // ... autres valeurs par défaut
          });
        }
      } catch (error) {
        console.error('❌ Erreur lors du chargement des paramètres:', error);
        console.log('📝 Erreur API, utilisation des valeurs par défaut');
        setSettings({
          id: 'default',
          title: 'Paramètres de Cookies',
          description: 'Gérez vos préférences de cookies',
          accept_button_text: 'Accepter',
          reject_button_text: 'Refuser',
          // ... autres valeurs par défaut
        });
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings || isDisabled) return;

    setSaving(true);
    try {
      console.log('💾 Sauvegarde des paramètres cookies...');
      
      const response = await apiClient.post('/cookie-settings', settings);
      if (!response.success) {
        throw new Error(response.error || 'Erreur lors de la sauvegarde');
      }
      
      console.log('✅ Paramètres cookies sauvegardés');
      
      // Mettre à jour le cache pour que les changements soient visibles immédiatement
      localStorage.setItem('cookie-settings-cache', JSON.stringify(response.data));
      
      // Déclencher un événement personnalisé pour notifier les autres composants
      window.dispatchEvent(new CustomEvent('cookie-settings-updated', {
        detail: response.data
      }));
      
      toast.success("Paramètres des cookies enregistrés avec succès");
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde:', error);
      toast.error("Impossible d'enregistrer les paramètres");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Chargement des paramètres...</p>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-muted-foreground">Aucun paramètre trouvé</p>
          <Button 
            className="mt-4" 
            onClick={() => window.location.reload()}
          >
            Recharger
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Configuration générale */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            <CardTitle>Configuration générale</CardTitle>
          </div>
          <CardDescription>
            Paramètres principaux de la bannière de cookies
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Titre principal</Label>
              <Input
                value={settings.title ?? ""}
                onChange={(e) => setSettings({ ...settings, title: e.target.value })}
                disabled={isDisabled}
                placeholder="Nous utilisons des cookies"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={settings.is_active ?? false}
                onCheckedChange={(checked) => setSettings({ ...settings, is_active: checked })}
                disabled={isDisabled}
              />
              <Label>Activer la bannière de cookies</Label>
            </div>
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              value={settings.description ?? ""}
              onChange={(e) => setSettings({ ...settings, description: e.target.value })}
              disabled={isDisabled}
              rows={3}
              placeholder="Description de l'utilisation des cookies..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Position de la bannière</Label>
              <Select
                value={settings.banner_position}
                onValueChange={(value: 'top' | 'bottom') => 
                  setSettings({ ...settings, banner_position: value })}
                disabled={isDisabled}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="top">En haut</SelectItem>
                  <SelectItem value="bottom">En bas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Type d'affichage</Label>
              <Select
                value={settings.banner_layout}
                onValueChange={(value: 'banner' | 'modal' | 'sidebar') => 
                  setSettings({ ...settings, banner_layout: value })}
                disabled={isDisabled}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="banner">Bannière</SelectItem>
                  <SelectItem value="modal">Modal</SelectItem>
                  <SelectItem value="sidebar">Barre latérale</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Textes des boutons */}
      <Card>
        <CardHeader>
          <CardTitle>Boutons d'action</CardTitle>
          <CardDescription>
            Personnalisez le texte des boutons
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Bouton "Accepter"</Label>
              <Input
                value={settings.accept_button_text ?? ""}
                onChange={(e) => setSettings({ ...settings, accept_button_text: e.target.value })}
                disabled={isDisabled}
              />
            </div>
            <div>
              <Label>Bouton "Refuser"</Label>
              <Input
                value={settings.reject_button_text ?? ""}
                onChange={(e) => setSettings({ ...settings, reject_button_text: e.target.value })}
                disabled={isDisabled}
              />
            </div>
            <div>
              <Label>Bouton "Paramètres"</Label>
              <Input
                value={settings.settings_button_text ?? ""}
                onChange={(e) => setSettings({ ...settings, settings_button_text: e.target.value })}
                disabled={isDisabled}
              />
            </div>
            <div>
              <Label>Bouton "Sauvegarder"</Label>
              <Input
                value={settings.save_preferences_text ?? ""}
                onChange={(e) => setSettings({ ...settings, save_preferences_text: e.target.value })}
                disabled={isDisabled}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Types de cookies */}
      <Card>
        <CardHeader>
          <CardTitle>Types de cookies</CardTitle>
          <CardDescription>
            Configuration des différents types de cookies
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Cookies nécessaires */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <h4 className="font-medium">Cookies nécessaires (toujours activés)</h4>
            </div>
            <div className="grid grid-cols-1 gap-4 pl-5">
              <div>
                <Label>Titre</Label>
                <Input
                  value={settings.necessary_cookies_title ?? ""}
                  onChange={(e) => setSettings({ ...settings, necessary_cookies_title: e.target.value })}
                  disabled={isDisabled}
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={settings.necessary_cookies_description ?? ""}
                  onChange={(e) => setSettings({ ...settings, necessary_cookies_description: e.target.value })}
                  disabled={isDisabled}
                  rows={2}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Cookies analytiques */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <h4 className="font-medium">Cookies analytiques</h4>
              </div>
              <Switch
                checked={settings.analytics_cookies_enabled ?? false}
                onCheckedChange={(checked) => setSettings({ ...settings, analytics_cookies_enabled: checked })}
                disabled={isDisabled}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 pl-5">
              <div>
                <Label>Titre</Label>
                <Input
                  value={settings.analytics_cookies_title ?? ""}
                  onChange={(e) => setSettings({ ...settings, analytics_cookies_title: e.target.value })}
                  disabled={isDisabled}
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={settings.analytics_cookies_description ?? ""}
                  onChange={(e) => setSettings({ ...settings, analytics_cookies_description: e.target.value })}
                  disabled={isDisabled}
                  rows={2}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Cookies marketing */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <h4 className="font-medium">Cookies marketing</h4>
              </div>
              <Switch
                checked={settings.marketing_cookies_enabled ?? false}
                onCheckedChange={(checked) => setSettings({ ...settings, marketing_cookies_enabled: checked })}
                disabled={isDisabled}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 pl-5">
              <div>
                <Label>Titre</Label>
                <Input
                  value={settings.marketing_cookies_title ?? ""}
                  onChange={(e) => setSettings({ ...settings, marketing_cookies_title: e.target.value })}
                  disabled={isDisabled}
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={settings.marketing_cookies_description ?? ""}
                  onChange={(e) => setSettings({ ...settings, marketing_cookies_description: e.target.value })}
                  disabled={isDisabled}
                  rows={2}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liens légaux */}
      <Card>
        <CardHeader>
          <CardTitle>Liens légaux</CardTitle>
          <CardDescription>
            URLs vers vos pages légales
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>URL Politique de confidentialité</Label>
              <Input
                value={settings.privacy_policy_url ?? ""}
                onChange={(e) => setSettings({ ...settings, privacy_policy_url: e.target.value })}
                disabled={isDisabled}
                placeholder="/privacy"
              />
            </div>
            <div>
              <Label>URL Politique des cookies</Label>
              <Input
                value={settings.cookie_policy_url ?? ""}
                onChange={(e) => setSettings({ ...settings, cookie_policy_url: e.target.value })}
                disabled={isDisabled}
                placeholder="/cookies"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Apparence */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            <CardTitle>Apparence</CardTitle>
          </div>
          <CardDescription>
            Personnalisez les couleurs de la bannière
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label>Couleur principale</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={settings.primary_color ?? "#3B82F6"}
                  onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })}
                  disabled={isDisabled}
                  className="w-12 h-10 p-1"
                />
                <Input
                  value={settings.primary_color ?? ""}
                  onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })}
                  disabled={isDisabled}
                  placeholder="#3B82F6"
                  className="flex-1"
                />
              </div>
            </div>
            <div>
              <Label>Couleur secondaire</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={settings.secondary_color ?? "#6B7280"}
                  onChange={(e) => setSettings({ ...settings, secondary_color: e.target.value })}
                  disabled={isDisabled}
                  className="w-12 h-10 p-1"
                />
                <Input
                  value={settings.secondary_color ?? ""}
                  onChange={(e) => setSettings({ ...settings, secondary_color: e.target.value })}
                  disabled={isDisabled}
                  placeholder="#6B7280"
                  className="flex-1"
                />
              </div>
            </div>
            <div>
              <Label>Arrière-plan</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={settings.background_color ?? "#FFFFFF"}
                  onChange={(e) => setSettings({ ...settings, background_color: e.target.value })}
                  disabled={isDisabled}
                  className="w-12 h-10 p-1"
                />
                <Input
                  value={settings.background_color ?? ""}
                  onChange={(e) => setSettings({ ...settings, background_color: e.target.value })}
                  disabled={isDisabled}
                  placeholder="#FFFFFF"
                  className="flex-1"
                />
              </div>
            </div>
            <div>
              <Label>Couleur du texte</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={settings.text_color ?? "#1F2937"}
                  onChange={(e) => setSettings({ ...settings, text_color: e.target.value })}
                  disabled={isDisabled}
                  className="w-12 h-10 p-1"
                />
                <Input
                  value={settings.text_color ?? ""}
                  onChange={(e) => setSettings({ ...settings, text_color: e.target.value })}
                  disabled={isDisabled}
                  placeholder="#1F2937"
                  className="flex-1"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bouton de sauvegarde */}
      <div className="flex justify-end">
        <Button 
          type="submit" 
          disabled={saving || isDisabled}
          className="min-w-[200px]"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Enregistrement...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Enregistrer les paramètres
            </>
          )}
        </Button>
      </div>
    </form>
  );
};
