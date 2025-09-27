import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContextNew";
import { toast } from "sonner";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { LogOut } from "lucide-react";

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
}

export const AdminLayout = ({ children, title }: AdminLayoutProps) => {
  const { user, loading, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  // Afficher le spinner de chargement pendant la vérification d'authentification
  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </main>
    );
  }

  // Rediriger si l'utilisateur n'est pas connecté
  if (!user) {
    toast.error("Veuillez vous connecter pour accéder à cette page");
    navigate("/auth/login");
    return null;
  }

  // Rediriger si l'utilisateur n'est pas admin
  if (!isAdmin) {
    toast.error("Vous n'avez pas les droits administrateur nécessaires");
    navigate("/dashboard");
    return null;
  }

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar>
          <SidebarHeader>
            <div className="px-3 py-2">
              <h2 className="text-xl font-bold text-primary">Administration</h2>
              <p className="text-sm text-gray-500">Gestion du coworking</p>
            </div>
          </SidebarHeader>
          <SidebarContent>
            {/* The sidebar navigation will be placed here by AdminNavigation */}
          </SidebarContent>
          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={() => navigate("/dashboard")}
                  tooltip="Retour"
                >
                  <span>Retour au compte</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={handleLogout}
                  tooltip="Déconnexion"
                >
                  <LogOut />
                  <span>Déconnexion</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>
        <div className="flex-1 overflow-auto">
          <header className="p-4 bg-gray-50 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <h1 className="text-xl font-bold">{title}</h1>
            </div>
          </header>
          <main className="p-4">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};
