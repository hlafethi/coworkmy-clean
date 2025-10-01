import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserProfile } from "../hooks/useUsers";
import { UserPersonalInfo } from "./UserPersonalInfo";
import { UserAdditionalInfo } from "./UserAdditionalInfo";
import { UserDocuments } from "../UserDocuments";
import { User, FileText, Building2 } from "lucide-react";
import { usePersistedTab } from "@/hooks/usePersistedTab";

interface UserDetailsDialogProps {
  user: UserProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loading?: boolean;
}

export const UserDetailsDialog = ({ user, open, onOpenChange, loading = false }: UserDetailsDialogProps) => {
  const [activeTab, setActiveTab] = usePersistedTab("user-details", "profile");
  
  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Détails de l'utilisateur
          </DialogTitle>
          <DialogDescription>
            Informations détaillées sur {user.first_name} {user.last_name}
            {user.company && ` - ${user.company}`}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <p>Chargement des détails...</p>
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="profile" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Profil
                </TabsTrigger>
                <TabsTrigger value="company" className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Entreprise
                </TabsTrigger>
                <TabsTrigger value="documents" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Documents
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="profile" className="space-y-6 mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <UserPersonalInfo user={user} />
                  <UserAdditionalInfo user={user} />
                </div>
              </TabsContent>
              
              <TabsContent value="company" className="space-y-6 mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <UserAdditionalInfo user={user} />
                  {user.logo_url && (
                    <div className="p-4 border rounded-lg">
                      <h3 className="font-medium mb-2">Logo de l'entreprise</h3>
                      <img 
                        src={user.logo_url} 
                        alt="Logo de l'entreprise" 
                        className="h-24 w-auto object-contain"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="documents" className="space-y-6 mt-6">
                <UserDocuments 
                  userId={user.id}
                  userName={`${user.first_name} ${user.last_name}`}
                  userCompany={user.company}
                />
              </TabsContent>
              
              <div className="flex justify-end mt-6">
                <Button onClick={() => onOpenChange(false)}>
                  Fermer
                </Button>
              </div>
            </Tabs>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
