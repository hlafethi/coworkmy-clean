import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { usePersistedTab } from '@/hooks/usePersistedTab';
import { 
import { logger } from '@/utils/logger';
  LifeBuoy, 
  FileQuestion, 
  FileText, 
  Send, 
  Loader2,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  User
} from 'lucide-react';

// Types pour les tickets
interface Ticket {
  id: string;
  subject: string;
  message: string;
  priority: string;
  status: string;
  created_at: string;
  updated_at?: string;
  user_name: string;
  user_email: string;
}

interface TicketResponse {
  id: string;
  ticket_id: string;
  user_id: string;
  message: string;
  is_admin: boolean;
  created_at: string;
}

export const AdminSupport = () => {
  // États pour les tickets
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [ticketResponses, setTicketResponses] = useState<TicketResponse[]>([]);
  const [responseMessage, setResponseMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);
  const [isLoadingResponses, setIsLoadingResponses] = useState(false);
  const [activeTab, setActiveTab] = usePersistedTab("support", "tickets");

  // Charger les tickets
  const loadTickets = async () => {
    setIsLoadingTickets(true);
    try {
      // TODO: Remplacer par l'appel API réel
      const mockTickets: Ticket[] = [
        {
          id: '1',
          subject: 'Problème de connexion',
          message: 'Je n\'arrive pas à me connecter à mon compte',
          priority: 'high',
          status: 'open',
          created_at: new Date().toISOString(),
          user_name: 'John Doe',
          user_email: 'john@example.com'
        },
        {
          id: '2',
          subject: 'Question sur les tarifs',
          message: 'Pouvez-vous m\'expliquer les différents tarifs disponibles ?',
          priority: 'medium',
          status: 'pending',
          created_at: new Date().toISOString(),
          user_name: 'Jane Smith',
          user_email: 'jane@example.com'
        }
      ];
      setTickets(mockTickets);
    } catch (error) {
      logger.error('Erreur chargement tickets:', error);
      toast.error('Erreur lors du chargement des tickets');
    } finally {
      setIsLoadingTickets(false);
    }
  };

  // Charger les réponses d'un ticket
  const loadTicketResponses = async (ticketId: string) => {
    setIsLoadingResponses(true);
    try {
      // TODO: Remplacer par l'appel API réel
      const mockResponses: TicketResponse[] = [
        {
          id: '1',
          ticket_id: ticketId,
          user_id: 'user1',
          message: 'Bonjour, j\'ai un problème avec ma connexion',
          is_admin: false,
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          ticket_id: ticketId,
          user_id: 'admin1',
          message: 'Bonjour, pouvez-vous me donner plus de détails sur votre problème ?',
          is_admin: true,
          created_at: new Date().toISOString()
        }
      ];
      setTicketResponses(mockResponses);
    } catch (error) {
      logger.error('Erreur chargement réponses:', error);
      toast.error('Erreur lors du chargement des réponses');
    } finally {
      setIsLoadingResponses(false);
    }
  };

  // Effet pour charger les tickets
  useEffect(() => {
    loadTickets();
  }, []);

  // Effet pour charger les réponses quand un ticket est sélectionné
  useEffect(() => {
    if (selectedTicket) {
      loadTicketResponses(selectedTicket.id);
    }
  }, [selectedTicket]);

  // Gestion de l'ajout d'une réponse admin
  const handleResponseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !responseMessage.trim()) return;

    setIsLoading(true);
    try {
      // TODO: Remplacer par l'appel API réel
      const newResponse: TicketResponse = {
        id: Date.now().toString(),
        ticket_id: selectedTicket.id,
        user_id: 'admin1',
        message: responseMessage.trim(),
        is_admin: true,
        created_at: new Date().toISOString()
      };
      
      setTicketResponses(prev => [...prev, newResponse]);
      toast.success('Réponse ajoutée');
      setResponseMessage('');
    } catch (error) {
      logger.error('Erreur ajout réponse:', error);
      toast.error('Erreur lors de l\'ajout de la réponse');
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction pour obtenir la couleur du statut
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Fonction pour obtenir la couleur de la priorité
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Gestion du support</h1>
          <p className="text-gray-600">
            Gérez les tickets de support et répondez aux demandes des utilisateurs
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-1">
            <TabsTrigger value="tickets" className="flex items-center gap-2">
              <LifeBuoy className="h-4 w-4" />
              <span className="font-medium">Tickets de support</span>
            </TabsTrigger>
          </TabsList>

          {/* Onglet Tickets */}
          <TabsContent value="tickets" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Liste des tickets */}
              <Card>
                <CardHeader>
                  <CardTitle>Tickets de support</CardTitle>
                  <CardDescription>
                    Liste de tous les tickets de support
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingTickets ? (
                    <div className="flex justify-center items-center h-32">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : tickets.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      <LifeBuoy className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>Aucun ticket trouvé</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {tickets.map((ticket) => (
                        <div
                          key={ticket.id}
                          className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                            selectedTicket?.id === ticket.id ? 'bg-blue-50 border-blue-500' : 'hover:bg-gray-50'
                          }`}
                          onClick={() => setSelectedTicket(ticket)}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold text-lg">{ticket.subject}</h3>
                            <div className="flex gap-2">
                              <Badge className={getStatusColor(ticket.status)}>
                                {ticket.status}
                              </Badge>
                              <Badge className={getPriorityColor(ticket.priority)}>
                                {ticket.priority}
                              </Badge>
                            </div>
                          </div>
                          <p className="text-gray-600 mb-2 line-clamp-2">{ticket.message}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <User className="h-4 w-4" />
                              <span>{ticket.user_name}</span>
                            </div>
                            <span>{ticket.user_email}</span>
                            <span>•</span>
                            <span>{new Date(ticket.created_at).toLocaleString('fr-FR')}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Détails du ticket sélectionné */}
              {selectedTicket && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{selectedTicket.subject}</CardTitle>
                        <CardDescription>
                          Par {selectedTicket.user_name} ({selectedTicket.user_email})
                        </CardDescription>
                      </div>
                      <Button variant="outline" onClick={() => setSelectedTicket(null)}>
                        Fermer
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <h4 className="font-medium mb-2">Message original:</h4>
                      <p className="text-gray-700 bg-gray-50 p-3 rounded">{selectedTicket.message}</p>
                    </div>

                    <div className="mb-4">
                      <h4 className="font-medium mb-2">Conversation:</h4>
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {isLoadingResponses ? (
                          <div className="flex justify-center items-center h-16">
                            <Loader2 className="h-4 w-4 animate-spin" />
                          </div>
                        ) : ticketResponses.length === 0 ? (
                          <div className="text-center text-gray-500 py-4">
                            <MessageSquare className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                            <p className="text-sm">Aucune réponse pour le moment</p>
                          </div>
                        ) : (
                          ticketResponses.map((response) => (
                            <div
                              key={response.id}
                              className={`p-3 rounded-lg ${
                                response.is_admin 
                                  ? 'bg-blue-50 border-l-4 border-blue-500' 
                                  : 'bg-gray-50 border-l-4 border-gray-300'
                              }`}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-sm">
                                  {response.is_admin ? 'Support' : selectedTicket.user_name}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {new Date(response.created_at).toLocaleString('fr-FR')}
                                </span>
                              </div>
                              <p className="text-gray-700 text-sm">{response.message}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Formulaire pour ajouter une réponse */}
                    <form onSubmit={handleResponseSubmit} className="pt-4 border-t">
                      <div className="flex gap-2">
                        <Input
                          value={responseMessage}
                          onChange={(e) => setResponseMessage(e.target.value)}
                          placeholder="Ajouter une réponse..."
                          disabled={isLoading}
                        />
                        <Button type="submit" disabled={isLoading || !responseMessage.trim()}>
                          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
