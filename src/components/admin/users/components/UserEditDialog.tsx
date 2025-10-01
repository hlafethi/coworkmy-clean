import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { UserProfile } from "../hooks/useUsers";

interface UserEditDialogProps {
  user: UserProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (userId: string, userData: Partial<UserProfile>) => Promise<boolean>;
}

export const UserEditDialog = ({ user, open, onOpenChange, onSave }: UserEditDialogProps) => {
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    first_name: '',
    last_name: '',
    phone: '',
    company: '',
    city: '',
    is_admin: false,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email || '',
        full_name: user.full_name || '',
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone: user.phone || '',
        company: user.company || '',
        city: user.address_city || '',
        is_admin: false, // On ne peut pas modifier le statut admin depuis l'interface pour l'instant
      });
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const success = await onSave(user.id, formData);
      if (success) {
        onOpenChange(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Modifier l'utilisateur</DialogTitle>
          <DialogDescription>
            Modifiez les informations de {user.first_name} {user.last_name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="email@example.com"
            />
          </div>

          <div>
            <Label htmlFor="full_name">Nom complet</Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => handleInputChange('full_name', e.target.value)}
              placeholder="Nom complet"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="first_name">Prénom</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => handleInputChange('first_name', e.target.value)}
                placeholder="Prénom"
              />
            </div>
            <div>
              <Label htmlFor="last_name">Nom</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => handleInputChange('last_name', e.target.value)}
                placeholder="Nom"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="phone">Téléphone</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="+33 1 23 45 67 89"
            />
          </div>

          <div>
            <Label htmlFor="company">Entreprise</Label>
            <Input
              id="company"
              value={formData.company}
              onChange={(e) => handleInputChange('company', e.target.value)}
              placeholder="Nom de l'entreprise"
            />
          </div>

          <div>
            <Label htmlFor="city">Ville</Label>
            <Input
              id="city"
              value={formData.city}
              onChange={(e) => handleInputChange('city', e.target.value)}
              placeholder="Ville"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_admin"
              checked={formData.is_admin}
              onCheckedChange={(checked) => handleInputChange('is_admin', checked)}
              disabled
            />
            <Label htmlFor="is_admin">Administrateur (non modifiable)</Label>
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Sauvegarde...' : 'Sauvegarder'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
