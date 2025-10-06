
import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiClient } from "@/lib/api-client";
import { logger } from '@/utils/logger';

interface EmailHistoryItem {
  id: string;
  recipient: string;
  subject: string;
  status: string;
  sent_at: string | null;
  error_message: string | null;
}

export const EmailHistory = () => {
  const [history, setHistory] = useState<EmailHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const result = await apiClient.get("/email-history");
        
        if (result.success && Array.isArray(result.data)) {
          setHistory(result.data);
        } else {
          logger.error("Erreur lors de la récupération de l'historique:", result.message);
        }
      } catch (error) {
        logger.error("Erreur lors de la récupération de l'historique:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  if (loading) {
    return <div>Chargement de l'historique...</div>;
  }

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Historique des envois</h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Destinataire</TableHead>
            <TableHead>Sujet</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Date d'envoi</TableHead>
            <TableHead>Message d'erreur</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {history.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{item.recipient}</TableCell>
              <TableCell>{item.subject}</TableCell>
              <TableCell>
                <span
                  className={`px-2 py-1 rounded-full text-xs ${
                    item.status === "sent"
                      ? "bg-green-100 text-green-800"
                      : item.status === "error"
                      ? "bg-red-100 text-red-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {item.status}
                </span>
              </TableCell>
              <TableCell>
                {item.sent_at
                  ? new Date(item.sent_at).toLocaleString()
                  : "Non envoyé"}
              </TableCell>
              <TableCell>{item.error_message || "-"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
