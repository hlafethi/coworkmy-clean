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
import { UserEditDialog } from "./users/components/UserEditDialog";
import { UserDeleteDialog } from "./users/components/UserDeleteDialog";

const AdminUsers = () => {
  const { users, loading, getUserById, updateUser, deleteUser } = useUsers();
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [userDetailsOpen, setUserDetailsOpen] = useState(false);
  const [userEditOpen, setUserEditOpen] = useState(false);
  const [userDeleteOpen, setUserDeleteOpen] = useState(false);

  const handleViewDetails = async (user: UserProfile) => {
    const freshUser = await getUserById(user.id);
    setSelectedUser(freshUser || user);
    setUserDetailsOpen(true);
  };

  const handleEditUser = (user: UserProfile) => {
    setSelectedUser(user);
    setUserEditOpen(true);
  };

  const handleDeleteUser = (user: UserProfile) => {
    setSelectedUser(user);
    setUserDeleteOpen(true);
  };

  const handleSaveUser = async (userId: string, userData: Partial<UserProfile>) => {
    return await updateUser(userId, userData);
  };

  const handleDeleteUserConfirm = async (userId: string) => {
    return await deleteUser(userId);
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
            <UserTable 
              users={users} 
              onViewDetails={handleViewDetails}
              onEdit={handleEditUser}
              onDelete={handleDeleteUser}
            />
          )}
        </CardContent>
      </Card>

      <UserDetailsDialog
        user={selectedUser}
        open={userDetailsOpen}
        onOpenChange={setUserDetailsOpen}
      />

      <UserEditDialog
        user={selectedUser}
        open={userEditOpen}
        onOpenChange={setUserEditOpen}
        onSave={handleSaveUser}
      />

      <UserDeleteDialog
        user={selectedUser}
        open={userDeleteOpen}
        onOpenChange={setUserDeleteOpen}
        onDelete={handleDeleteUserConfirm}
      />
    </div>
  );
};

export default AdminUsers;
