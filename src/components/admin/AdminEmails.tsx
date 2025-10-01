import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmailTemplateForm } from "./emails/EmailTemplateForm";
import { EmailTemplateList } from "./emails/EmailTemplateList";
import { EmailHistory } from "./emails/EmailHistory";
import { EmailConfigForm } from "./emails/EmailConfigForm";
import { usePersistedTab } from "@/hooks/usePersistedTab";

const AdminEmails = () => {
  const [activeTab, setActiveTab] = usePersistedTab("emails", "templates");
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Gestion des emails</h2>
          <p className="text-gray-500">
            Gérez vos modèles d'emails et consultez l'historique des envois
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="templates">Modèles</TabsTrigger>
          <TabsTrigger value="create">Nouveau modèle</TabsTrigger>
          <TabsTrigger value="history">Historique</TabsTrigger>
          <TabsTrigger value="config">Configuration</TabsTrigger>
        </TabsList>

        <TabsContent value="templates">
          <Card className="p-6">
            <EmailTemplateList />
          </Card>
        </TabsContent>

        <TabsContent value="create">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Créer un modèle</h3>
            <EmailTemplateForm mode="create" />
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card className="p-6">
            <EmailHistory />
          </Card>
        </TabsContent>

        <TabsContent value="config">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Configuration SMTP</h3>
            <EmailConfigForm />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminEmails;
