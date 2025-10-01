import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { UserProfile } from "../hooks/useUsers";
import { AlertTriangle } from "lucide-react";

interface UserDeleteDialogProps {
  user: UserProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: (userId: string) => Promise<boolean>;
}

export const UserDeleteDialog = ({ user, open, onOpenChange, onDelete }: UserDeleteDialogProps) => {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const success = await onDelete(user.id);
      if (success) {
        onOpenChange(false);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Supprimer l'utilisateur
          </DialogTitle>
          <DialogDescription>
            Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="text-sm text-red-800">
              <p className="font-medium">Utilisateur à supprimer :</p>
              <p><strong>Nom :</strong> {user.first_name} {user.last_name}</p>
              <p><strong>Email :</strong> {user.email}</p>
              {user.company && <p><strong>Entreprise :</strong> {user.company}</p>}
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800">
              ⚠️ <strong>Attention :</strong> Toutes les données associées à cet utilisateur seront définitivement supprimées.
            </p>
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete} 
            disabled={loading}
          >
            {loading ? 'Suppression...' : 'Supprimer définitivement'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
