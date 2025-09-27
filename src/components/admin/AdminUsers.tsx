import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { useUsers, type UserProfile } from "./users/hooks/useUsers";
import { UserTable } from "./users/components/UserTable";
import { UserDetailsDialog } from "./users/components/UserDetailsDialog";

const AdminUsers = () => {
  const { users, loading, getUserById } = useUsers();
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [userDetailsOpen, setUserDetailsOpen] = useState(false);

  const handleViewDetails = async (user: UserProfile) => {
    const freshUser = await getUserById(user.id);
    setSelectedUser(freshUser || user);
    setUserDetailsOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gestion des utilisateurs</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des utilisateurs</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <p>Chargement des utilisateurs...</p>
            </div>
          ) : users.length === 0 ? (
            <p className="text-center py-4">Aucun utilisateur trouvé.</p>
          ) : (
            <UserTable users={users} onViewDetails={handleViewDetails} />
          )}
        </CardContent>
      </Card>

      <UserDetailsDialog
        user={selectedUser}
        open={userDetailsOpen}
        onOpenChange={setUserDetailsOpen}
      />
    </div>
  );
};

export default AdminUsers;
