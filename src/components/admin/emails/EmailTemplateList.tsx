import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import { EmailTemplateForm } from "./EmailTemplateForm";
import { logger } from '@/utils/logger';

interface EmailTemplate {
  id: string;
  type: string;
  name: string;
  subject: string;
  content: string;
  created_at: string;
}

export const EmailTemplateList = () => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [dialogMode, setDialogMode] = useState<"edit" | "duplicate">("edit");

  const fetchTemplates = async () => {
    try {
      const result = await apiClient.get('/email-templates');
      
      if (result.success && result.data) {
        setTemplates(result.data);
      } else {
        logger.error("Erreur lors de la récupération des modèles:", result.error);
        toast.error("Erreur lors de la récupération des modèles");
        setTemplates([]);
      }
    } catch (error) {
      logger.error("Erreur lors de la récupération des modèles:", error);
      toast.error("Erreur lors de la récupération des modèles");
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce modèle ?")) return;

    try {
      const result = await apiClient.delete(`/email-templates/${id}`);
      
      if (!result.success) throw new Error(result.message || "Erreur lors de la suppression");

      toast.success("Modèle supprimé avec succès");
      fetchTemplates();
    } catch (error) {
      logger.error("Erreur lors de la suppression:", error);
      toast.error("Erreur lors de la suppression du modèle");
    }
  };

  const handleEdit = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setDialogMode("edit");
    setIsDialogOpen(true);
  };

  const handleDuplicate = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setDialogMode("duplicate");
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingTemplate(null);
  };

  const handleSuccess = () => {
    fetchTemplates();
    handleDialogClose();
  };

  if (loading) {
    return <div>Chargement des modèles...</div>;
  }

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Modèles d'emails</h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nom</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Sujet</TableHead>
            <TableHead>Date de création</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {templates.map((template) => (
            <TableRow key={template.id}>
              <TableCell>{template.name}</TableCell>
              <TableCell className="font-mono text-sm">{template.type}</TableCell>
              <TableCell>{template.subject}</TableCell>
              <TableCell>
                {new Date(template.created_at).toLocaleString()}
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(template)}
                  >
                    Modifier
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDuplicate(template)}
                  >
                    Dupliquer
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(template.id)}
                  >
                    Supprimer
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === "edit" ? "Modifier le modèle" : "Dupliquer le modèle"}
            </DialogTitle>
            <DialogDescription>
              {dialogMode === "edit" 
                ? "Modifiez les détails de votre modèle d'email. Le type ne peut pas être modifié."
                : "Créez une copie de ce modèle d'email. Vous pouvez modifier tous les champs."
              }
            </DialogDescription>
          </DialogHeader>
          {editingTemplate && (
            <EmailTemplateForm
              mode={dialogMode}
              initialValues={
                dialogMode === "duplicate"
                  ? {
                      type: `${editingTemplate.type}_copy`,
                      name: `${editingTemplate.name} (copie)`,
                      subject: editingTemplate.subject,
                      content: editingTemplate.content,
                    }
                  : editingTemplate
              }
              onSuccess={handleSuccess}
              onCancel={handleDialogClose}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
