import { User, Phone, Mail, MapPin, Calendar, Camera } from "lucide-react";
import { UserProfile } from "../hooks/useUsers";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { logger } from '@/utils/logger';

interface UserPersonalInfoProps {
  user: UserProfile;
}

export const UserPersonalInfo = ({ user }: UserPersonalInfoProps) => {
  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    const first = firstName?.charAt(0) || '';
    const last = lastName?.charAt(0) || '';
    return (first + last).toUpperCase() || 'U';
  };

  return (
    <div>
      <h3 className="text-sm font-medium text-muted-foreground mb-1">
        Informations personnelles
      </h3>
      <div className="bg-muted p-4 rounded-md space-y-3">
        {/* Photo de profil */}
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
            <AvatarImage 
              src={user.avatar_url || user.profile_picture} 
              alt="Photo de profil"
              className="object-cover"
              onError={(e) => {
                logger.warn('Erreur de chargement de l\'avatar admin:', e);
              }}
            />
            <AvatarFallback className="text-sm font-semibold bg-gradient-to-br from-blue-500 to-purple-600 text-white">
              {getInitials(user.first_name, user.last_name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Nom complet:</span>
              <span className="text-sm">{user.first_name || ''} {user.last_name || ''}</span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {user.avatar_url ? 'Photo de profil disponible' : 'Aucune photo de profil'}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Email:</span>
          <span className="text-sm">{user.email || 'Non renseigné'}</span>
        </div>
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Téléphone:</span>
          <span className="text-sm">{user.phone || user.phone_number || 'Non renseigné'}</span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Adresse:</span>
          <span className="text-sm">{user.address_street || 'Non renseignée'}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Ville:</span>
          <span className="text-sm">{user.address_city || 'Non renseignée'}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Code postal:</span>
          <span className="text-sm">{user.address_postal_code || 'Non renseigné'}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Pays:</span>
          <span className="text-sm">{user.address_country || 'Non renseigné'}</span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Date de naissance:</span>
          <span className="text-sm">{user.birth_date ? new Date(user.birth_date).toLocaleDateString('fr-FR') : 'Non renseignée'}</span>
        </div>
      </div>
    </div>
  );
};
