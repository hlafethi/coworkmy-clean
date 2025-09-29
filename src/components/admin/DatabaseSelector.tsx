import React, { useState, useEffect } from 'react';
import { DATABASE_CONFIGS, getCurrentDatabaseConfig, setCurrentDatabase } from '../../config/database';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

const DatabaseSelector: React.FC = () => {
  const [selected, setSelected] = useState(getCurrentDatabaseConfig().id);

  useEffect(() => {
    setCurrentDatabase(selected);
    // Le changement de base de données sera appliqué au prochain rechargement de l'app
  }, [selected]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuration de la base de données</CardTitle>
        <CardDescription>
          Sélectionnez la base de données à utiliser pour l'application
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="db-select">Base de données actuelle</Label>
          <Select value={selected} onValueChange={setSelected}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner une base de données" />
            </SelectTrigger>
            <SelectContent>
              {DATABASE_CONFIGS.map(db => (
                <SelectItem key={db.id} value={db.id}>
                  {db.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Le changement de base de données sera appliqué au prochain rechargement de l'application.
            Redémarrez l'application pour que les modifications prennent effet.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export { DatabaseSelector }; 