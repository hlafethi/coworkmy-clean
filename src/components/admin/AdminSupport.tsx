import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { withRetry } from "@/utils/supabaseUtils";
import { toast } from "sonner";
import { MessageCircle, TicketIcon, CheckCircle, XCircle, Send, FileQuestion, FileText } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { LifeBuoy, MessageSquare } from "lucide-react";

// Types pour les tickets et les messages de chat
interface Ticket {
  id: string;
  user_id: string;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  created_at: string;
  user_email?: string;
  user_name?: string;
}

interface ChatMessage {
  id: string;
  user_id: string;
  message: string;
  is_admin: boolean;
  is_read: boolean;
  created_at: string;
  profile?: {
    full_name: string;
  };
}

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  order: number;
}

interface KnowledgeBase {
  id: string;
  title: string;
  content: string;
  category: string;
  order: number;
}

const AdminSupport = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [ticketResponses, setTicketResponses] = useState<any[]>([]);
  const [ticketResponse, setTicketResponse] = useState("");
  const [chatResponse, setChatResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("tickets");
  const [ticketFilter, setTicketFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved' | 'closed'>('all');

  // États pour la FAQ et la base de connaissances
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeBase[]>([]);
  const [newFaq, setNewFaq] = useState({ question: "", answer: "", category: "general" });
  const [newArticle, setNewArticle] = useState({ title: "", content: "", category: "general" });
  
  // Refs pour éviter les re-renders inutiles
  const dataIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Charger les données initiales
  useEffect(() => {
    loadData();
    
    // Démarrer l'intervalle pour les données (rafraîchissement toutes les 30 secondes)
    dataIntervalRef.current = setInterval(loadData, 30000);
    
    return () => {
      if (dataIntervalRef.current) {
        clearInterval(dataIntervalRef.current);
      }
    };
  }, []); // Dépendances vides pour ne s'exécuter qu'une fois

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      // Charger les tickets sans jointure pour éviter l'erreur
      const { data: ticketsData, error: ticketsError } = await withRetry(async () => {
        return await supabase
          .from('support_tickets')
          .select('*')
          .order('created_at', { ascending: false });
      });

      if (ticketsError) throw ticketsError;

      // Charger les profils séparément si nécessaire
      const userIds = [...new Set(ticketsData?.map((ticket: any) => ticket.user_id) || [])];
      let profilesData: any[] = [];
      
      if (userIds.length > 0) {
        const { data: profiles, error: profilesError } = await withRetry(async () => {
          return await supabase
            .from('profiles')
            .select('id, full_name, email')
            .in('id', userIds);
        });
        
        if (!profilesError) {
          profilesData = profiles || [];
        }
      }

      // Formater les données des tickets avec les informations de profil
      const formattedTickets = ticketsData?.map((ticket: any) => {
        const profile = profilesData.find(p => p.id === ticket.user_id);
        return {
          ...ticket,
          user_email: profile?.email || 'utilisateur@example.com',
          user_name: profile?.full_name || 'Utilisateur'
        };
      }) || [];

      setTickets(formattedTickets);

      // Charger les messages de chat sans jointure
      const { data: chatData, error: chatError } = await withRetry(async () => {
        return await supabase
          .from('support_chat_messages')
          .select('*')
          .order('created_at', { ascending: true });
      });

      if (chatError) throw chatError;

      // Formater les données des messages de chat
      const formattedChatMessages = chatData?.map((message: any) => {
        const profile = profilesData.find(p => p.id === message.user_id);
        return {
          ...message,
          user_email: profile?.email || 'utilisateur@example.com',
          user_name: profile?.full_name || 'Utilisateur'
        };
      }) || [];

      setChatMessages(formattedChatMessages);
    } catch (error) {
      console.error("Erreur lors du chargement des données de support:", error);
      toast.error("Impossible de charger les données de support");
    } finally {
      setLoading(false);
    }
  }, []);

  // Gestion de la FAQ
  const handleAddFaq = async () => {
    try {
      const { error } = await supabase
        .from('faqs')
        .insert([{
          ...newFaq,
          order: faqs.length + 1
        }]);

      if (error) throw error;

      toast.success("FAQ ajoutée avec succès");
      setNewFaq({ question: "", answer: "", category: "general" });
      loadData();
    } catch (error) {
      console.error("Erreur lors de l'ajout de la FAQ:", error);
      toast.error("Impossible d'ajouter la FAQ");
    }
  };

  // Gestion de la base de connaissances
  const handleAddArticle = async () => {
    try {
      const { error } = await supabase
        .from('knowledge_base')
        .insert([{
          ...newArticle,
          order: knowledgeBase.length + 1
        }]);

      if (error) throw error;

      toast.success("Article ajouté avec succès");
      setNewArticle({ title: "", content: "", category: "general" });
      loadData();
    } catch (error) {
      console.error("Erreur lors de l'ajout de l'article:", error);
      toast.error("Impossible d'ajouter l'article");
    }
  };

  // Charger les réponses lorsqu'un ticket est sélectionné
  useEffect(() => {
    if (selectedTicket) {
      loadTicketResponses(selectedTicket.id);
    }
  }, [selectedTicket]);

  // Filtrer les tickets en fonction du statut sélectionné
  const filteredTickets = ticketFilter === 'all'
    ? tickets
    : tickets.filter(ticket => ticket.status === ticketFilter);

  // Charger les réponses d'un ticket
  const loadTicketResponses = useCallback(async (ticketId: string) => {
    try {
      setLoading(true);
      const { data, error } = await withRetry(async () => {
        return await supabase
          .from('support_ticket_responses')
          .select('*')
          .eq('ticket_id', ticketId)
          .order('created_at', { ascending: true });
      });

      if (error) throw error;

      setTicketResponses(data || []);
    } catch (error) {
      console.error("Erreur lors du chargement des réponses:", error);
      toast.error("Impossible de charger les réponses");
    } finally {
      setLoading(false);
    }
  }, []);

  // Répondre à un ticket
  const handleTicketResponse = async () => {
    if (!selectedTicket || !ticketResponse.trim()) return;

    try {
      // Mettre à jour le statut du ticket
      const { error: updateError } = await withRetry(async () => {
        return await supabase
          .from('support_tickets')
          .update({ status: 'in_progress' })
          .eq('id', selectedTicket.id);
      });

      if (updateError) throw updateError;

      // Récupérer l'ID de l'utilisateur authentifié (l'admin)
      const { data: { user: adminUser } } = await supabase.auth.getUser();

      if (!adminUser) throw new Error("Utilisateur non authentifié");

      // Enregistrer la réponse dans la table support_ticket_responses
      const { error: responseError } = await withRetry(async () => {
        return await supabase
          .from('support_ticket_responses')
          .insert([{
            ticket_id: selectedTicket.id,
            user_id: adminUser.id, // Utiliser l'ID de l'admin authentifié
            message: ticketResponse,
            is_admin: true
          }]);
      });

      if (responseError) throw responseError;

      // Mettre à jour l'interface
      setTickets(tickets.map(ticket =>
        ticket.id === selectedTicket.id
          ? { ...ticket, status: 'in_progress' }
          : ticket
      ));

      // Recharger les réponses
      loadTicketResponses(selectedTicket.id);

      toast.success("Réponse envoyée avec succès");
      setTicketResponse("");
    } catch (error) {
      console.error("Erreur lors de l'envoi de la réponse:", error);
      toast.error("Impossible d'envoyer la réponse");
    }
  };

  // Marquer un ticket comme résolu
  const resolveTicket = async (ticketId: string) => {
    try {
      const { error } = await withRetry(async () => {
        return await supabase
          .from('support_tickets')
          .update({ status: 'resolved' })
          .eq('id', ticketId);
      });

      if (error) throw error;

      // Mettre à jour l'interface
      setTickets(tickets.map(ticket =>
        ticket.id === ticketId
          ? { ...ticket, status: 'resolved' }
          : ticket
      ));

      toast.success("Ticket marqué comme résolu");
    } catch (error) {
      console.error("Erreur lors de la résolution du ticket:", error);
      toast.error("Impossible de résoudre le ticket");
    }
  };

  // Fermer un ticket
  const closeTicket = async (ticketId: string) => {
    try {
      const { error } = await withRetry(async () => {
        return await supabase
          .from('support_tickets')
          .update({ status: 'closed' })
          .eq('id', ticketId);
      });

      if (error) throw error;

      // Mettre à jour l'interface
      setTickets(tickets.map(ticket =>
        ticket.id === ticketId
          ? { ...ticket, status: 'closed' }
          : ticket
      ));

      toast.success("Ticket fermé avec succès");
    } catch (error) {
      console.error("Erreur lors de la fermeture du ticket:", error);
      toast.error("Impossible de fermer le ticket");
    }
  };

  // Envoyer un message de chat
  const sendChatMessage = async () => {
    if (!chatResponse.trim()) return;

    try {
      // Récupérer l'ID de l'utilisateur authentifié (l'admin)
      const { data: { user: adminUser } } = await supabase.auth.getUser();

      if (!adminUser) throw new Error("Utilisateur non authentifié");

      // Enregistrer le message dans la base de données
      const { error } = await withRetry(async () => {
        return await supabase
          .from('support_chat_messages')
          .insert([{
            user_id: adminUser.id, // Utiliser l'ID de l'admin authentifié
            message: chatResponse,
            is_admin: true,
            is_read: false
          }]);
      });

      if (error) throw error;

      toast.success("Message envoyé avec succès");
      setChatResponse("");
    } catch (error) {
      console.error("Erreur lors de l'envoi du message:", error);
      toast.error("Impossible d'envoyer le message");
    }
  };

  // Obtenir la couleur du badge en fonction du statut
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-blue-600';
      case 'in_progress':
        return 'bg-yellow-700';
      case 'resolved':
        return 'bg-green-600';
      case 'closed':
        return 'bg-gray-600';
      default:
        return 'bg-gray-600';
    }
  };

  // Obtenir le libellé du statut en français
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open':
        return 'Ouvert';
      case 'in_progress':
        return 'En cours';
      case 'resolved':
        return 'Résolu';
      case 'closed':
        return 'Fermé';
      default:
        return status;
    }
  };

  // Formater la date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Gestion du support</h2>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="tickets" className="flex items-center gap-2">
            <TicketIcon className="h-4 w-4" />
            <span>Tickets</span>
          </TabsTrigger>
          <TabsTrigger value="chat" className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            <span>Chat en ligne</span>
          </TabsTrigger>
          <TabsTrigger value="faq" className="flex items-center gap-2">
            <FileQuestion className="h-4 w-4" />
            <span>FAQ</span>
          </TabsTrigger>
          <TabsTrigger value="knowledge" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span>Base de connaissances</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tickets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tickets de support</CardTitle>
              <CardDescription>
                Gérez les demandes d'assistance des utilisateurs.
              </CardDescription>
              <div className="flex gap-2 mt-4">
                <Button
                  variant={ticketFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTicketFilter('all')}
                >
                  Tous
                </Button>
                <Button
                  variant={ticketFilter === 'open' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTicketFilter('open')}
                  className="flex items-center gap-1"
                >
                  <span className="h-2 w-2 rounded-full bg-blue-600"></span>
                  Ouverts
                </Button>
                <Button
                  variant={ticketFilter === 'in_progress' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTicketFilter('in_progress')}
                  className="flex items-center gap-1"
                >
                  <span className="h-2 w-2 rounded-full bg-yellow-700"></span>
                  En cours
                </Button>
                <Button
                  variant={ticketFilter === 'resolved' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTicketFilter('resolved')}
                  className="flex items-center gap-1"
                >
                  <span className="h-2 w-2 rounded-full bg-green-600"></span>
                  Résolus
                </Button>
                <Button
                  variant={ticketFilter === 'closed' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTicketFilter('closed')}
                  className="flex items-center gap-1"
                >
                  <span className="h-2 w-2 rounded-full bg-gray-600"></span>
                  Fermés
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : filteredTickets.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Aucun ticket trouvé
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border rounded-md overflow-hidden">
                    <div className="bg-gray-50 p-3 border-b font-medium">
                      Liste des tickets
                    </div>
                    <div className="divide-y max-h-[500px] overflow-y-auto">
                      {filteredTickets.map(ticket => (
                        <div
                          key={ticket.id}
                          className={`p-3 cursor-pointer hover:bg-gray-50 transition-colors ${selectedTicket?.id === ticket.id ? 'bg-gray-100' : ''}`}
                          onClick={() => setSelectedTicket(ticket)}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium">{ticket.subject}</h4>
                              <p className="text-sm text-gray-500">
                                {ticket.user_name} ({ticket.user_email})
                              </p>
                              <p className="text-xs text-gray-600 mt-1">
                                {formatDate(ticket.created_at)}
                              </p>
                            </div>
                            <Badge className={getStatusBadgeColor(ticket.status)}>
                              {getStatusLabel(ticket.status)}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border rounded-md overflow-hidden">
                    <div className="bg-gray-50 p-3 border-b font-medium">
                      Détails du ticket
                    </div>
                    {selectedTicket ? (
                      <div className="p-4 flex flex-col h-[500px]">
                        <div className="mb-4">
                          <div className="flex justify-between items-start">
                            <h3 className="text-lg font-semibold">{selectedTicket.subject}</h3>
                            <Badge className={getStatusBadgeColor(selectedTicket.status)}>
                              {getStatusLabel(selectedTicket.status)}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">
                            De: {selectedTicket.user_name} ({selectedTicket.user_email})
                          </p>
                          <p className="text-xs text-gray-600 mt-1">
                            {formatDate(selectedTicket.created_at)}
                          </p>
                        </div>

                        <div className="border-t border-b py-4 mb-4 flex-1 overflow-y-auto space-y-4">
                          {/* Message initial */}
                          <div className="bg-gray-100 rounded-lg px-4 py-2">
                            <p className="whitespace-pre-wrap">{selectedTicket.message}</p>
                            <p className="text-xs text-gray-600 mt-1">
                              {formatDate(selectedTicket.created_at)}
                            </p>
                          </div>

                          {/* Réponses */}
                          {ticketResponses.map((response) => (
                            <div
                              key={response.id}
                              className={`${response.is_admin ? 'bg-primary text-white' : 'bg-gray-100'} rounded-lg px-4 py-2`}
                            >
                              <p className="whitespace-pre-wrap">{response.message}</p>
                              <p className="text-xs mt-1 text-opacity-80">
                                {response.is_admin ? 'Support' : 'Utilisateur'} -
                                {formatDate(response.created_at)}
                              </p>
                            </div>
                          ))}
                        </div>

                        {selectedTicket.status !== 'closed' && (
                          <div className="space-y-4">
                            <div>
                              <label htmlFor="response" className="block text-sm font-medium mb-1">
                                Votre réponse
                              </label>
                              <Textarea
                                id="response"
                                placeholder="Saisissez votre réponse..."
                                rows={3}
                                value={ticketResponse}
                                onChange={(e) => setTicketResponse(e.target.value)}
                              />
                            </div>

                            <div className="flex justify-between">
                              <div>
                                {selectedTicket.status !== 'resolved' && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => resolveTicket(selectedTicket.id)}
                                    className="flex items-center gap-1"
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                    Marquer comme résolu
                                  </Button>
                                )}
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => closeTicket(selectedTicket.id)}
                                  className="flex items-center gap-1 bg-red-100 text-red-900 hover:bg-red-200 hover:text-red-900 border-red-300"
                                >
                                  <XCircle className="h-4 w-4" />
                                  Fermer
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={handleTicketResponse}
                                  disabled={!ticketResponse.trim()}
                                  className="flex items-center gap-1"
                                >
                                  <Send className="h-4 w-4" />
                                  Répondre
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-[500px] text-gray-600">
                        <p>Sélectionnez un ticket pour voir les détails</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chat" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Messages de chat</CardTitle>
              <CardDescription>
                Gérez les conversations en temps réel avec les utilisateurs.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : chatMessages.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Aucun message de chat trouvé
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="border rounded-md overflow-hidden md:col-span-1">
                    <div className="bg-gray-50 p-3 border-b font-medium">
                      Utilisateurs récents
                    </div>
                    <div className="divide-y max-h-[500px] overflow-y-auto">
                      {/* Liste des utilisateurs avec des conversations récentes */}
                      {chatMessages.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                          Aucun utilisateur récent
                        </div>
                      ) : (
                        <div className="p-4 text-center text-gray-500">
                          Les utilisateurs apparaîtront ici
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="border rounded-md overflow-hidden md:col-span-2">
                    <div className="bg-gray-50 p-3 border-b font-medium flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center text-sm">
                          U
                        </div>
                        <span>Utilisateur</span>
                      </div>
                      <Badge className="bg-green-600">En ligne</Badge>
                    </div>
                    <div className="flex flex-col h-[500px]">
                      <div className="flex-1 p-4 overflow-y-auto space-y-4">
                        {chatMessages.length === 0 ? (
                          <div className="flex items-center justify-center h-full text-gray-500">
                            <p>Aucun message de chat</p>
                          </div>
                        ) : (
                          chatMessages.map((msg, index) => (
                            <div
                              key={index}
                              className={`flex ${msg.is_admin ? 'justify-end' : 'justify-start'}`}
                            >
                              <div
                                className={`max-w-[80%] rounded-lg px-4 py-2 ${msg.is_admin
                                    ? 'bg-primary text-white'
                                    : 'bg-gray-100 text-gray-800'
                                  }`}
                              >
                                <p className="whitespace-pre-wrap">{msg.message}</p>
                                <p className="text-xs mt-1 text-opacity-80">
                                  {msg.is_admin ? 'Support' : msg.profile?.full_name || 'Utilisateur'} -
                                  {formatDate(msg.created_at)}
                                </p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      <div className="p-4 border-t">
                        <form onSubmit={(e) => { e.preventDefault(); sendChatMessage(); }} className="flex gap-2">
                          <Input
                            placeholder="Tapez votre message..."
                            value={chatResponse}
                            onChange={(e) => setChatResponse(e.target.value)}
                            className="flex-1"
                          />
                          <Button type="submit" disabled={!chatResponse.trim()}>
                            <Send className="h-4 w-4" />
                          </Button>
                        </form>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="faq">
          <Card>
            <CardHeader>
              <CardTitle>Gestion de la FAQ</CardTitle>
              <CardDescription>
                Ajoutez et gérez les questions fréquemment posées.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Formulaire d'ajout de FAQ */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Ajouter une nouvelle FAQ</h3>
                  <div className="grid gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Question</label>
                      <Input
                        value={newFaq.question}
                        onChange={(e) => setNewFaq({ ...newFaq, question: e.target.value })}
                        placeholder="Entrez la question"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Réponse</label>
                      <Textarea
                        value={newFaq.answer}
                        onChange={(e) => setNewFaq({ ...newFaq, answer: e.target.value })}
                        placeholder="Entrez la réponse"
                        rows={4}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Catégorie</label>
                      <Input
                        value={newFaq.category}
                        onChange={(e) => setNewFaq({ ...newFaq, category: e.target.value })}
                        placeholder="Catégorie (ex: general, reservation, paiement)"
                      />
                    </div>
                    <Button onClick={handleAddFaq}>Ajouter la FAQ</Button>
                  </div>
                </div>

                {/* Liste des FAQs existantes */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">FAQs existantes</h3>
                  <div className="space-y-4">
                    {faqs.map((faq) => (
                      <Card key={faq.id}>
                        <CardHeader>
                          <CardTitle className="text-base">{faq.question}</CardTitle>
                          <CardDescription>Catégorie: {faq.category}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-gray-600">{faq.answer}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="knowledge">
          <Card>
            <CardHeader>
              <CardTitle>Base de connaissances</CardTitle>
              <CardDescription>
                Gérez les articles de la base de connaissances.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Formulaire d'ajout d'article */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Ajouter un nouvel article</h3>
                  <div className="grid gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Titre</label>
                      <Input
                        value={newArticle.title}
                        onChange={(e) => setNewArticle({ ...newArticle, title: e.target.value })}
                        placeholder="Entrez le titre de l'article"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Contenu</label>
                      <Textarea
                        value={newArticle.content}
                        onChange={(e) => setNewArticle({ ...newArticle, content: e.target.value })}
                        placeholder="Entrez le contenu de l'article"
                        rows={6}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Catégorie</label>
                      <Input
                        value={newArticle.category}
                        onChange={(e) => setNewArticle({ ...newArticle, category: e.target.value })}
                        placeholder="Catégorie (ex: guide, tutoriel, reference)"
                      />
                    </div>
                    <Button onClick={handleAddArticle}>Ajouter l'article</Button>
                  </div>
                </div>

                {/* Liste des articles existants */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Articles existants</h3>
                  <div className="space-y-4">
                    {knowledgeBase.map((article) => (
                      <Card key={article.id}>
                        <CardHeader>
                          <CardTitle className="text-base">{article.title}</CardTitle>
                          <CardDescription>Catégorie: {article.category}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="prose max-w-none">
                            {article.content}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSupport;
