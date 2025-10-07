
import { Button } from "@/components/ui/button";
import { Users, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface UserHeaderProps {
  firstName?: string | null;
  lastName?: string | null;
  onLogout: () => void;
}

export const UserHeader = ({ firstName, lastName, onLogout }: UserHeaderProps) => {
  const navigate = useNavigate();

  return (
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mon Espace Personnel</h1>
        <p className="text-muted-foreground">
          Bienvenue {firstName} {lastName}
        </p>
      </div>
      <div className="space-x-4">
        <Button 
          onClick={() => navigate("/profile")}
          variant="outline"
        >
          <Users className="mr-2 h-4 w-4" />
          Mon profil
        </Button>
        <Button 
          onClick={onLogout}
          variant="outline"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Déconnexion
        </Button>
      </div>
    </div>
  );
};
