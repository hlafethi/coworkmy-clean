import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContextPostgreSQL';
import { SupportService } from '@/services/supportService';
import { 
  FileQuestion, 
  LifeBuoy, 
  FileText, 
  Plus, 
  Send, 
  Loader2,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle
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
}

interface TicketResponse {
  id: string;
  ticket_id: string;
  user_id: string;
  message: string;
  is_admin: boolean;
  created_at: string;
}

export const SupportSystem = () => {
  const { user } = useAuth();
  
  // États pour les tickets
  const [ticketSubmitted, setTicketSubmitted] = useState(false);
  const [userTickets, setUserTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);
  const [showTicketForm, setShowTicketForm] = useState(false);
  
  // États pour les réponses de tickets
  const [ticketResponses, setTicketResponses] = useState<TicketResponse[]>([]);
  const [responseMessage, setResponseMessage] = useState('');
  const [isLoadingResponses, setIsLoadingResponses] = useState(false);
  
  // États pour les FAQ
  const [faqs, setFaqs] = useState<any[]>([]);
  const [isLoadingFaqs, setIsLoadingFaqs] = useState(false);
  
  // États pour la documentation
  const [kbArticles, setKbArticles] = useState<any[]>([]);
  const [isLoadingKb, setIsLoadingKb] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<any | null>(null);

  // Charger les tickets de l'utilisateur
  const loadUserTickets = useCallback(async () => {
    if (!user) return;
    
    setIsLoadingTickets(true);
    try {
      const tickets = await SupportService.getUserTickets();
      setUserTickets(Array.isArray(tickets) ? tickets : []);
    } catch (error) {
      console.error('Erreur chargement tickets:', error);
      toast.error('Erreur lors du chargement des tickets');
    } finally {
      setIsLoadingTickets(false);
    }
  }, [user]);

  // Charger les réponses d'un ticket
  const loadTicketResponses = useCallback(async (ticketId: string) => {
    setIsLoadingResponses(true);
    try {
      const responses = await SupportService.getTicketResponses(ticketId);
      setTicketResponses(responses);
    } catch (error) {
      console.error('Erreur chargement réponses:', error);
      toast.error('Erreur lors du chargement des réponses');
    } finally {
      setIsLoadingResponses(false);
    }
  }, []);

  // Charger les FAQ
  const loadFAQs = useCallback(async () => {
    setIsLoadingFaqs(true);
    try {
      const faqData = await SupportService.getFAQs();
      setFaqs(faqData);
    } catch (error) {
      console.error('Erreur chargement FAQ:', error);
    } finally {
      setIsLoadingFaqs(false);
    }
  }, []);

  // Charger la documentation
  const loadKbArticles = useCallback(async () => {
    setIsLoadingKb(true);
    try {
      const articles = await SupportService.getKBArticles();
      setKbArticles(articles);
    } catch (error) {
      console.error('Erreur chargement documentation:', error);
    } finally {
      setIsLoadingKb(false);
    }
  }, []);

  // Effet pour charger les données
  useEffect(() => {
    if (user) {
      loadUserTickets();
    }
    loadFAQs();
    loadKbArticles();
  }, [user, loadUserTickets, loadFAQs, loadKbArticles]);

  // Effet pour charger les réponses quand un ticket est sélectionné
  useEffect(() => {
    if (selectedTicket) {
      loadTicketResponses(selectedTicket.id);
    }
  }, [selectedTicket, loadTicketResponses]);

  // Gestion de la soumission d'un ticket
  const handleTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const subject = formData.get('subject') as string;
    const message = formData.get('message') as string;
    const priority = formData.get('priority') as string;

    if (!subject || !message) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    setIsLoading(true);
    try {
      await SupportService.createTicket({ subject, message, priority });
      toast.success('Ticket créé avec succès');
      setTicketSubmitted(true);
      setShowTicketForm(false);
      loadUserTickets();
    } catch (error) {
      console.error('Erreur création ticket:', error);
      toast.error('Erreur lors de la création du ticket');
    } finally {
      setIsLoading(false);
    }
  };

  // Gestion de l'ajout d'une réponse
  const handleResponseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !responseMessage.trim()) return;

    setIsLoading(true);
    try {
      await SupportService.addTicketResponse(selectedTicket.id, responseMessage.trim());
      toast.success('Réponse ajoutée');
      setResponseMessage('');
      loadTicketResponses(selectedTicket.id);
    } catch (error) {
      console.error('Erreur ajout réponse:', error);
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
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Centre d'aide</h1>
          <p className="text-gray-600">
            Trouvez des réponses à vos questions ou contactez notre équipe de support
          </p>
        </div>

        <Tabs defaultValue="faq" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="faq" className="flex items-center gap-2">
              <FileQuestion className="h-4 w-4" />
              <span className="font-medium text-primary">FAQ</span>
            </TabsTrigger>
            <TabsTrigger value="tickets" className="flex items-center gap-2">
              <LifeBuoy className="h-4 w-4" />
              <span className="font-medium text-primary">Tickets</span>
            </TabsTrigger>
            <TabsTrigger value="docs" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="font-medium text-primary">Documentation</span>
            </TabsTrigger>
          </TabsList>

          {/* Onglet FAQ */}
          <TabsContent value="faq" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Questions fréquemment posées</CardTitle>
                <CardDescription>
                  Trouvez rapidement des réponses aux questions les plus courantes.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingFaqs ? (
                  <div className="flex justify-center items-center h-32">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : faqs.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <FileQuestion className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Aucune FAQ disponible pour le moment</p>
                    <p className="text-sm mt-2">Notre équipe prépare les questions fréquentes.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {faqs.map((faq) => (
                      <div key={faq.id} className="border rounded-lg p-4">
                        <h3 className="font-semibold text-lg mb-2">{faq.question}</h3>
                        <p className="text-gray-600">{faq.answer}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onglet Tickets */}
          <TabsContent value="tickets" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Mes tickets de support</CardTitle>
                    <CardDescription>
                      Gérez vos demandes de support et suivez leur progression.
                    </CardDescription>
                  </div>
                  <Button onClick={() => setShowTicketForm(true)} className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Nouveau ticket
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {showTicketForm ? (
                  <Card className="mb-6">
                    <CardHeader>
                      <CardTitle>Créer un nouveau ticket</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleTicketSubmit} className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">Sujet</label>
                          <Input name="subject" placeholder="Décrivez brièvement votre problème" required />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Priorité</label>
                          <Select name="priority" defaultValue="medium">
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">Faible</SelectItem>
                              <SelectItem value="medium">Moyenne</SelectItem>
                              <SelectItem value="high">Élevée</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Message</label>
                          <Textarea name="message" placeholder="Décrivez votre problème en détail" required />
                        </div>
                        <div className="flex gap-2">
                          <Button type="submit" disabled={isLoading}>
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Créer le ticket'}
                          </Button>
                          <Button type="button" variant="outline" onClick={() => setShowTicketForm(false)}>
                            Annuler
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                ) : null}

                {isLoadingTickets ? (
                  <div className="flex justify-center items-center h-32">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : !Array.isArray(userTickets) || userTickets.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <LifeBuoy className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Aucun ticket créé</p>
                    <p className="text-sm mt-2">Créez votre premier ticket pour obtenir de l'aide.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {userTickets.map((ticket) => (
                      <div key={ticket.id} className="border rounded-lg p-4">
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
                        <p className="text-gray-600 mb-2">{ticket.message}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>Créé le {new Date(ticket.created_at).toLocaleString('fr-FR')}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedTicket(ticket)}
                          >
                            Voir les réponses
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Affichage des réponses d'un ticket sélectionné */}
                {selectedTicket && (
                  <Card className="mt-6">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Réponses pour: {selectedTicket.subject}</CardTitle>
                          <CardDescription>
                            Conversation avec l'équipe de support
                          </CardDescription>
                        </div>
                        <Button variant="outline" onClick={() => setSelectedTicket(null)}>
                          Fermer
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4 max-h-96 overflow-y-auto">
                        {isLoadingResponses ? (
                          <div className="flex justify-center items-center h-32">
                            <Loader2 className="h-6 w-6 animate-spin" />
                          </div>
                        ) : ticketResponses.length === 0 ? (
                          <div className="text-center text-gray-500 py-8">
                            <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                            <p>Aucune réponse pour le moment</p>
                            <p className="text-sm mt-2">L'équipe de support vous répondra bientôt.</p>
                          </div>
                        ) : (
                          ticketResponses.map((response) => (
                            <div key={response.id} className={`p-4 rounded-lg ${response.is_admin ? 'bg-blue-50 border-l-4 border-blue-500' : 'bg-gray-50 border-l-4 border-gray-300'}`}>
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-medium text-sm">
                                  {response.is_admin ? 'Support' : 'Vous'}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {new Date(response.created_at).toLocaleString('fr-FR')}
                                </span>
                              </div>
                              <p className="text-gray-700">{response.message}</p>
                            </div>
                          ))
                        )}
                      </div>
                      
                      {/* Formulaire pour ajouter une réponse */}
                      <form onSubmit={handleResponseSubmit} className="mt-4 pt-4 border-t">
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
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onglet Documentation */}
          <TabsContent value="docs" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Documentation</CardTitle>
                <CardDescription>
                  Consultez notre documentation complète pour toutes les informations utiles.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingKb ? (
                  <div className="flex justify-center items-center h-32">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : kbArticles.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Aucune documentation disponible pour le moment</p>
                    <p className="text-sm mt-2">Notre équipe prépare la documentation complète.</p>
                  </div>
                ) : selectedArticle ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setSelectedArticle(null)}
                      >
                        ← Retour à la liste
                      </Button>
                    </div>
                    <div className="border rounded-lg p-6">
                      <h2 className="text-2xl font-bold mb-4">{selectedArticle.title}</h2>
                      <div className="flex items-center gap-4 mb-4 text-sm text-gray-600">
                        <span>Catégorie: {selectedArticle.category}</span>
                        {selectedArticle.author_name && (
                          <span>Auteur: {selectedArticle.author_name}</span>
                        )}
                        <span>Publié le: {new Date(selectedArticle.created_at).toLocaleDateString('fr-FR')}</span>
                      </div>
                      <div className="prose max-w-none">
                        <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                          {selectedArticle.content}
                        </div>
                      </div>
                      {selectedArticle.tags && selectedArticle.tags.length > 0 && (
                        <div className="mt-6 pt-4 border-t">
                          <div className="flex flex-wrap gap-2">
                            {selectedArticle.tags.map((tag: string, index: number) => (
                              <Badge key={index} variant="secondary">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {kbArticles.map((article) => (
                      <div key={article.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <h3 className="font-semibold text-lg mb-2">{article.title}</h3>
                        <p className="text-gray-600 mb-3 line-clamp-2">
                          {article.content.substring(0, 150)}...
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span>{article.category}</span>
                            {article.author_name && (
                              <>
                                <span>•</span>
                                <span>{article.author_name}</span>
                              </>
                            )}
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedArticle(article)}
                          >
                            Lire l'article
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
