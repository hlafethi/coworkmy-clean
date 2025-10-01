import { User, Phone, Calendar, Edit, Trash2 } from "lucide-react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { UserProfile } from "../hooks/useUsers";

interface UserTableRowProps {
  user: UserProfile;
  onViewDetails: (user: UserProfile) => void;
  onEdit?: (user: UserProfile) => void;
  onDelete?: (user: UserProfile) => void;
}

export const UserTableRow = ({ user, onViewDetails, onEdit, onDelete }: UserTableRowProps) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-gray-400" />
          <span className="font-medium">
            {user.first_name} {user.last_name}
          </span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-gray-400" />
          <span>{user.phone || 'Non renseigné'}</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-400" />
          <span>{user.created_at ? formatDate(user.created_at) : 'Non renseigné'}</span>
        </div>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex gap-2 justify-end">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onViewDetails(user)}
          >
            Voir détails
          </Button>
          {onEdit && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onEdit(user)}
              className="text-blue-600 hover:text-blue-700"
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
          {onDelete && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onDelete(user)}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
};
