import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
// Logger supprimé - utilisation de console directement
type DbType = "mysql" | "postgresql";

interface DbConfig {
  type: DbType;
  host: string;
  port: string;
  database: string;
  username: string;
  password: string;
}

interface DatabaseConfigProps {
  defaultType: DbType;
}

const DatabaseConfig = ({ defaultType }: DatabaseConfigProps) => {
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState<DbConfig>({
    type: defaultType,
    host: "",
    port: defaultType === "postgresql" ? "5432" : "3306",
    database: "",
    username: "",
    password: "",
  });

  const handleChange = (field: keyof DbConfig, value: string) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const testConnection = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke("test-database-connection", {
        body: { config }
      });

      if (error) throw error;
      toast.success("Connexion à la base de données réussie");
    } catch (error) {
      console.error("Erreur de connexion:", error);
      toast.error("Impossible de se connecter à la base de données");
    } finally {
      setLoading(false);
    }
  };

  const initializeDatabase = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke("initialize-database", {
        body: { config }
      });

      if (error) throw error;
      toast.success("Base de données initialisée avec succès");
    } catch (error) {
      console.error("Erreur d'initialisation:", error);
      toast.error("Impossible d'initialiser la base de données");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuration de la base de données</CardTitle>
        <CardDescription>
          Configurez votre base de données pour stocker les données de l'application
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <Label>Type de base de données</Label>
            <RadioGroup
              value={config.type}
              onValueChange={(value) => handleChange("type", value as DbType)}
              className="flex space-x-4 mt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="postgresql" id="postgresql" />
                <Label htmlFor="postgresql">PostgreSQL</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="mysql" id="mysql" />
                <Label htmlFor="mysql">MySQL</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="host">Hôte</Label>
              <Input
                id="host"
                placeholder="localhost"
                value={config.host}
                onChange={(e) => handleChange("host", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="port">Port</Label>
              <Input
                id="port"
                placeholder={config.type === "postgresql" ? "5432" : "3306"}
                value={config.port}
                onChange={(e) => handleChange("port", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="database">Nom de la base de données</Label>
            <Input
              id="database"
              placeholder="coworkspace"
              value={config.database}
              onChange={(e) => handleChange("database", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Nom d'utilisateur</Label>
            <Input
              id="username"
              value={config.username}
              onChange={(e) => handleChange("username", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <Input
              id="password"
              type="password"
              value={config.password}
              onChange={(e) => handleChange("password", e.target.value)}
            />
          </div>
        </div>

        <div className="flex space-x-4">
          <Button
            variant="outline"
            onClick={testConnection}
            disabled={loading}
          >
            Tester la connexion
          </Button>
          <Button
            onClick={initializeDatabase}
            disabled={loading}
          >
            Initialiser la base de données
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default DatabaseConfig;
