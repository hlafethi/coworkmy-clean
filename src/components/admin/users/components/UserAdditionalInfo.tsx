import { Building, Calendar } from "lucide-react";
import { UserProfile } from "../hooks/useUsers";

interface UserAdditionalInfoProps {
  user: UserProfile;
}

export const UserAdditionalInfo = ({ user }: UserAdditionalInfoProps) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div>
      <h3 className="text-sm font-medium text-muted-foreground mb-1">
        Informations additionnelles
      </h3>
      <div className="bg-muted p-4 rounded-md space-y-3">
        <div className="flex items-center gap-2">
          <Building className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Entreprise:</span>
          <span className="text-sm">{user.company || 'Non renseigné'}</span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Date d'inscription:</span>
          <span className="text-sm">
            {user.created_at ? formatDate(user.created_at) : 'Non renseigné'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">ID Utilisateur:</span>
          <span className="text-xs font-mono">{user.id}</span>
        </div>
      </div>
    </div>
  );
};
