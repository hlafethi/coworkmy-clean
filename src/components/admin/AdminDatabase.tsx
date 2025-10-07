import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import DatabaseConfig from "./DatabaseConfig";
import { supabase } from "@/integrations/supabase/client";
// Logger supprimé - utilisation de console directement
const SupabaseConfig = () => {
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState({
    url: "",
    key: "",
  });

  const handleChange = (field: string, value: string) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const testConnection = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('admin_settings')
        .select('*')
        .limit(1);

      if (error) throw error;
      toast.success("Connexion Supabase réussie");
    } catch (error) {
      console.error("Erreur de connexion Supabase:", error);
      toast.error("Impossible de se connecter à Supabase");
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    setLoading(true);
    try {
      localStorage.setItem('supabase_url', config.url);
      localStorage.setItem('supabase_key', config.key);
      toast.success("Configuration Supabase sauvegardée");
    } catch (error) {
      console.error("Erreur de sauvegarde:", error);
      toast.error("Impossible de sauvegarder la configuration");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuration Supabase</CardTitle>
        <CardDescription>
          Configurez votre connexion à Supabase
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="supabase_url">URL Supabase</Label>
            <Input
              id="supabase_url"
              placeholder="https://votre-projet.supabase.co"
              value={config.url}
              onChange={(e) => handleChange("url", e.target.value)}
              autoComplete="url"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="supabase_key">Clé d'API Supabase</Label>
            <Input
              id="supabase_key"
              type="password"
              value={config.key}
              onChange={(e) => handleChange("key", e.target.value)}
              autoComplete="new-password"
            />
          </div>
        </form>

        <div className="flex space-x-4">
          <Button
            variant="outline"
            onClick={testConnection}
            disabled={loading}
          >
            Tester la connexion
          </Button>
          <Button
            onClick={saveConfig}
            disabled={loading}
          >
            Sauvegarder
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const AdminDatabase = () => {
  const [activeTab, setActiveTab] = useState("supabase");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Base de données</CardTitle>
        <CardDescription>
          Gérez les connexions aux bases de données et initialisez les tables nécessaires
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="supabase">Supabase</TabsTrigger>
            <TabsTrigger value="postgresql">PostgreSQL</TabsTrigger>
            <TabsTrigger value="mysql">MySQL</TabsTrigger>
          </TabsList>
          <TabsContent value="supabase">
            <div className="mt-6">
              <SupabaseConfig />
            </div>
          </TabsContent>
          <TabsContent value="postgresql">
            <div className="mt-6">
              <DatabaseConfig key="postgresql" defaultType="postgresql" />
            </div>
          </TabsContent>
          <TabsContent value="mysql">
            <div className="mt-6">
              <DatabaseConfig key="mysql" defaultType="mysql" />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default AdminDatabase;
