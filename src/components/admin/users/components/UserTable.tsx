
import { 
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserProfile } from "../hooks/useUsers";
import { UserTableRow } from "./UserTableRow";

interface UserTableProps {
  users: UserProfile[];
  onViewDetails: (user: UserProfile) => void;
}

export const UserTable = ({ users, onViewDetails }: UserTableProps) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Utilisateur</TableHead>
          <TableHead>Téléphone</TableHead>
          <TableHead>Date d'inscription</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <UserTableRow 
            key={user.id}
            user={user}
            onViewDetails={onViewDetails}
          />
        ))}
      </TableBody>
    </Table>
  );
};
