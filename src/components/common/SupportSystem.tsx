import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { 
  Loader2, 
  AlertCircle,
  X,
  MessageCircle,
  FileText,
  FileQuestion,
  LifeBuoy,
  Send,
  Wifi,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';
import { useAuth } from '@/context/AuthContextNew';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { RealtimeConfigTester } from './RealtimeConfigTester';

// Génère un UUID v4 simple
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function getOrCreateGuestId() {
  let guestId = localStorage.getItem('support_guest_id');
  if (!guestId) {
    guestId = `support_guest_${generateUUID()}`;
    localStorage.setItem('support_guest_id', guestId);
  }
  return guestId;
}

// Ajout d'un type pour les sessions/conversations
interface ChatSession {
  id: string;
  user_id: string;
  status: 'open' | 'closed';
  created_at: string;
  closed_at?: string;
  rating?: number;
}

interface ChatMessage {
  id: string;
  session_id: string;
  user_id: string;
  message: string;
  is_admin: boolean;
  is_read: boolean;
  created_at: string;
}

// Ajout du type pour les réponses de ticket
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
  const [chatMessage, setChatMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [ticketSubmitted, setTicketSubmitted] = useState(false);
  const [userTickets, setUserTickets] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // États d'erreur et de debug
  const [error, setError] = useState<string | null>(null);
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  
  // Refs pour éviter les re-renders inutiles
  const currentUserIdRef = useRef<string | null>(null);

  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState<number>(0);

  // Ajout d'un état pour afficher le formulaire de création de ticket
  const [showTicketForm, setShowTicketForm] = useState(false);

  // Ajout des états pour le formulaire de création de ticket
  const [newTicketSubject, setNewTicketSubject] = useState('');
  const [newTicketMessage, setNewTicketMessage] = useState('');
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);

  // États pour les FAQ
  const [faqs, setFaqs] = useState<{ id: string; question: string; answer: string; category: string; order_index: number }[]>([]);
  const [isLoadingFaqs, setIsLoadingFaqs] = useState(false);

  // États pour la documentation
  const [kbArticles, setKbArticles] = useState<any[]>([]);
  const [isLoadingKb, setIsLoadingKb] = useState(false);
  const [selectedKbArticle, setSelectedKbArticle] = useState<any | null>(null);
  const [showKbModal, setShowKbModal] = useState(false);

  // Ajouter en haut du composant :
  const [tabValue, setTabValue] = useState('faq');

  // Ajout d'un état pour les réponses de ticket
  const [ticketResponses, setTicketResponses] = useState<TicketResponse[]>([]);
  const [ticketReply, setTicketReply] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const responsesEndRef = useRef<HTMLDivElement | null>(null);

  // Déplacement de fetchSessions hors du useEffect pour accessibilité globale
  const fetchSessions = async () => {
    if (!user) return;
    setIsLoadingChat(true);
    setError(null);
    const { data: sessions, error } = await supabase
      .from('support_chat_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });
    if (error) {
      setError('Erreur lors du chargement des sessions support');
      setIsLoadingChat(false);
      return;
    }
    setChatSessions(sessions || []);
    // Sélectionner la dernière session ouverte ou la plus récente
    if (sessions && sessions.length > 0) {
      const lastOpen = sessions.filter(s => s.status === 'open');
      setSelectedSession(lastOpen.length > 0 ? lastOpen[lastOpen.length - 1] : sessions[sessions.length - 1]);
    }
    setIsLoadingChat(false);
  };

  // useEffect pour charger toutes les sessions au montage ou quand l'utilisateur change
  useEffect(() => {
    fetchSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Fonction pour charger les FAQ depuis la base de données
  const loadFaqs = useCallback(async () => {
    setIsLoadingFaqs(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('support_faqs')
        .select('id, question, answer, category, order_index')
        .eq('is_active', true)
        .order('order_index', { ascending: true })
        .order('created_at', { ascending: true });

      if (error) {
        setError(`Erreur lors du chargement des FAQ: ${error.message}`);
        return;
      }

      setFaqs(data || []);
    } catch (err) {
      setError(`Erreur inattendue: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
    } finally {
      setIsLoadingFaqs(false);
    }
  }, []);

  // Charger les FAQ au montage
  useEffect(() => {
    loadFaqs();
  }, [loadFaqs]);

  // Fonction pour charger les tickets de l'utilisateur (extraitée pour être réutilisable)
  const loadUserTickets = useCallback(async () => {
    if (!user) return;
    setIsLoadingTickets(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) {
        setError(`Erreur lors du chargement des tickets: ${error.message}`);
        toast.error('Erreur lors du chargement des tickets');
        return;
      }
      setUserTickets(data || []);
    } catch (err) {
      setError(`Erreur inattendue: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
      toast.error('Erreur inattendue');
    } finally {
      setIsLoadingTickets(false);
    }
  }, [user]);

  // Charger les tickets au montage et quand l'utilisateur change
  useEffect(() => {
    if (user) {
      loadUserTickets();
    }
  }, [user, loadUserTickets]);

  // Fonction pour charger l'historique du chat (extraitée pour être réutilisable)
  const loadChatHistory = useCallback(async () => {
    if (!currentUserIdRef.current) return;
    setIsLoadingChat(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('support_chat_messages')
        .select('*')
        .eq('user_id', currentUserIdRef.current)
        .order('created_at', { ascending: true });
      if (error) {
        setError(`Erreur lors du chargement de l'historique: ${error.message}`);
        return;
      }
      setChatMessages(data || []);
    } catch (err) {
      setError(`Erreur inattendue: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
    } finally {
      setIsLoadingChat(false);
    }
  }, []);

  // Charger l'historique du chat à la connexion ou pour un invité
  useEffect(() => {
    if (user && user.id) {
      currentUserIdRef.current = user.id;
    } else {
      currentUserIdRef.current = getOrCreateGuestId();
    }
  }, [user]);

  // Abonnements Realtime pour notifications utilisateur
  useRealtimeSubscription({
    channelName: 'user_ticket_responses',
    table: 'support_ticket_responses',
    event: 'INSERT',
    onMessage: (payload) => {
      console.log('[SupportSystem] Nouvelle réponse reçue:', payload.new);
      
      // Ne notifier que si c'est l'admin qui a envoyé la réponse
      if (payload.new.is_admin) {
        toast.info('💬 Nouvelle réponse du support !', {
          description: `Ticket: ${payload.new.ticket_id}`,
          duration: 0, // Le toast reste jusqu'à validation manuelle
          action: {
            label: 'Voir',
            onClick: () => {
              // Recharger les réponses si le ticket sélectionné est concerné
              if (selectedTicket && payload.new.ticket_id === selectedTicket.id) {
                console.log('[SupportSystem] Rechargement des réponses pour le ticket sélectionné');
                loadUserTickets();
              }
              // Recharger aussi la liste des tickets pour mettre à jour le statut
              if (user) {
                loadUserTickets();
              }
            }
          }
        });
      }
    },
    onError: (error) => {
      console.error('[SupportSystem] Erreur abonnement réponses:', error);
      toast.error('Erreur de configuration des notifications réponses');
    },
    onStatusChange: (status) => {
      console.log('[SupportSystem] Statut abonnement réponses:', status);
    }
  });

  useRealtimeSubscription({
    channelName: 'user_tickets_updates',
    table: 'support_tickets',
    event: 'UPDATE',
    onMessage: (payload) => {
      console.log('[SupportSystem] Ticket mis à jour:', payload.new);
      toast.info('📝 Ticket mis à jour', {
        description: `Statut: ${payload.new.status}`,
        duration: 0, // Le toast reste jusqu'à validation manuelle
        action: {
          label: 'Actualiser',
          onClick: () => {
            loadUserTickets(); // Recharge la liste des tickets
          }
        }
      });
    },
    onError: (error) => {
      console.error('[SupportSystem] Erreur abonnement mises à jour tickets:', error);
    },
    onStatusChange: (status) => {
      console.log('[SupportSystem] Statut abonnement mises à jour tickets:', status);
    }
  });

  useRealtimeSubscription({
    channelName: 'user_chat_messages',
    table: 'support_chat_messages',
    event: 'INSERT',
    onMessage: (payload) => {
      console.log('[SupportSystem] Nouveau message reçu:', payload.new);
      // Rafraîchir automatiquement la liste des messages si la session correspond
      if (selectedSession && payload.new.session_id === selectedSession.id) {
        loadMessages(selectedSession);
      }
      // Ne notifier que si c'est l'admin qui a envoyé le message
      if (payload.new.is_admin) {
        toast.info('💬 Nouveau message du support !', {
          description: 'Votre conversation a été mise à jour',
          duration: 0, // Le toast reste jusqu'à validation manuelle
          action: {
            label: 'Voir',
            onClick: () => {
              loadChatHistory();
            }
          }
        });
      }
    },
    onError: (error) => {
      console.error('[SupportSystem] Erreur abonnement chat:', error);
      toast.error('Erreur de configuration des notifications chat');
    },
    onStatusChange: (status) => {
      console.log('[SupportSystem] Statut abonnement chat:', status);
    }
  });

  // Fonction pour charger les messages de chat
  const loadMessages = async (session?: ChatSession | null) => {
    if (!user || !session || !session.id) return;
    setIsLoadingChat(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('support_chat_messages')
        .select('*')
        .eq('session_id', session.id)
        .order('created_at', { ascending: true });
      if (error) {
        setError(`Erreur lors du chargement des messages: ${error.message}`);
        return;
      }
      setChatMessages(data || []);
      console.log('[SupportSystem] Messages récupérés pour la session', session?.id, ':', (data || []).length, data || []);
    } catch (err) {
      setError(`Erreur inattendue: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
    } finally {
      setIsLoadingChat(false);
    }
  };

  // Charger les messages quand une session est sélectionnée
  useEffect(() => {
    if (selectedSession) {
      loadMessages(selectedSession);
    }
  }, [selectedSession]);

  // Messages pour la session sélectionnée
  const messagesForSelectedSession = selectedSession
    ? chatMessages.filter(msg => msg.session_id === selectedSession.id)
    : [];

  // Fonction pour soumettre un nouveau ticket
  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicketSubject.trim() || !newTicketMessage.trim()) {
      toast.error('Sujet et message obligatoires');
      return;
    }
    setIsSubmittingTicket(true);
    setError(null);
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        setError('Utilisateur non authentifié');
        toast.error('Vous devez être connecté pour créer un ticket');
        setIsSubmittingTicket(false);
        return;
      }
      const { error } = await supabase.from('support_tickets').insert([
        {
          user_id: currentUser.id,
          subject: newTicketSubject.trim(),
          message: newTicketMessage.trim(),
          status: 'open',
          created_at: new Date().toISOString(),
        },
      ]);
      if (error) {
        setError(`Erreur lors de la création du ticket: ${error.message}`);
        toast.error('Erreur lors de la création du ticket');
        setIsSubmittingTicket(false);
        return;
      }
      setTicketSubmitted(true);
      setShowTicketForm(false);
      setNewTicketSubject('');
      setNewTicketMessage('');
      await loadUserTickets();
      toast.success('🎫 Ticket créé avec succès !', {
        description: 'Notre équipe vous répondra dans les 24 heures ouvrées',
        duration: 5000,
      });
    } catch (err) {
      setError(`Erreur inattendue: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
      toast.error('Erreur inattendue lors de la création du ticket');
    } finally {
      setIsSubmittingTicket(false);
    }
  };

  // Fonction pour soumettre un message de chat
  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim() || !selectedSession || !currentUserIdRef.current) {
      setError("Utilisateur non authentifié ou session non sélectionnée");
      toast.error("Vous devez être connecté pour envoyer un message");
      return;
    }
    console.log('user_id:', currentUserIdRef.current, typeof currentUserIdRef.current);
    try {
      setIsLoading(true);
      setError(null);
      console.log('[SupportSystem] Envoi message utilisateur', {
        user_id: user && user.id ? user.id : getOrCreateGuestId(),
        session_id: selectedSession.id,
        message: chatMessage.trim(),
        is_admin: false
      });
      const { error } = await supabase.from('support_chat_messages').insert([
        {
          user_id: user && user.id ? user.id : getOrCreateGuestId(),
          session_id: selectedSession.id,
          message: chatMessage.trim(),
          is_admin: false,
          is_read: false,
        },
      ]);
      if (error) {
        setError(`Erreur lors de l'envoi du message: ${error.message}`);
        toast.error('Erreur lors de l\'envoi du message');
        return;
      }
      setChatMessage('');
      toast.success('💬 Message envoyé !', {
        description: 'Notre équipe vous répondra dès que possible',
        duration: 3000,
      });
      await loadChatHistory();
    } catch (error) {
      console.error('[SupportSystem] Erreur inattendue lors de l\'envoi du message:', error);
      setError(`Erreur inattendue: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
      toast.error('Erreur lors de l\'envoi du message');
    } finally {
      setIsLoading(false);
    }
  };

  // Affichage des erreurs
  const renderError = () => {
    if (!error) return null;
    
    return (
      <Alert className="mb-4 border-red-200 bg-red-50">
        <AlertCircle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          <strong>Erreur :</strong> {error}
        </AlertDescription>
      </Alert>
    );
  };

  // Handler pour terminer la conversation
  const handleEndSession = async () => {
    if (!selectedSession) return;
    await supabase
      .from('support_chat_sessions')
      .update({ status: 'closed', closed_at: new Date().toISOString() })
      .eq('id', selectedSession.id);
    setShowRating(true);
    await fetchSessions();
  };

  // Handler pour enregistrer la note
  const handleRating = async (value: number) => {
    setRating(value);
    if (!selectedSession) return;
    await supabase
      .from('support_chat_sessions')
      .update({ rating: value })
      .eq('id', selectedSession.id);
    setShowRating(false);
    await fetchSessions();
  };

  // Colonne de gauche : afficher toutes les sessions
  const sessionsForHistory = chatSessions.slice().sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // Fonction pour charger les articles de documentation
  const loadKbArticles = useCallback(async () => {
    setIsLoadingKb(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('support_kb_articles')
        .select('*')
        .eq('is_active', true)
        .order('order_index', { ascending: true })
        .order('created_at', { ascending: true });
      if (error) {
        setError(`Erreur lors du chargement de la documentation: ${error.message}`);
        return;
      }
      setKbArticles(data || []);
    } catch (err) {
      setError(`Erreur inattendue: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
    } finally {
      setIsLoadingKb(false);
    }
  }, []);

  // Charger la documentation au montage
  useEffect(() => {
    loadKbArticles();
  }, [loadKbArticles]);

  // Ajout de la fonction pour créer une nouvelle session de chat utilisateur
  const handleNewChatSession = async () => {
    if (!user) return;
    setIsLoadingChat(true);
    setError(null);
    try {
      const { data: newSession, error } = await supabase
        .from('support_chat_sessions')
        .insert([{ user_id: user.id, status: 'open', created_at: new Date().toISOString() }])
        .select();
      if (error || !newSession || !newSession[0]) {
        setError('Erreur lors de la création de la nouvelle conversation');
        setIsLoadingChat(false);
        return;
      }
      setSelectedSession(newSession[0]);
      setChatMessages([]);
      setShowRating(false);
      setTimeout(() => {
        const input = document.querySelector('input[placeholder="Tapez votre message..."]') as HTMLInputElement;
        if (input) input.focus();
      }, 100);
    } catch (err) {
      setError('Erreur inattendue lors de la création de la conversation');
    } finally {
      setIsLoadingChat(false);
    }
  };

  // Mémoriser la session sélectionnée
  useEffect(() => {
    if (selectedSession) {
      localStorage.setItem('user_selected_session_id', selectedSession.id);
    }
  }, [selectedSession]);

  // Restaurer la session sélectionnée au chargement des sessions
  useEffect(() => {
    const lastSessionId = localStorage.getItem('user_selected_session_id');
    if (chatSessions.length > 0) {
      if (lastSessionId && chatSessions.some(s => s.id === lastSessionId)) {
        setSelectedSession(chatSessions.find(s => s.id === lastSessionId) || chatSessions[chatSessions.length - 1]);
      } else if (!selectedSession || !chatSessions.some(s => s.id === selectedSession.id)) {
        setSelectedSession(chatSessions[chatSessions.length - 1]);
      }
    }
  }, [chatSessions]);

  // Charger les réponses d'un ticket utilisateur
  const fetchTicketResponses = useCallback(async (ticketId: string) => {
    try {
      const { data, error } = await supabase
        .from('support_ticket_responses')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });
      if (!error && data) setTicketResponses(data);
    } catch (err) {
      // ignore
    }
  }, []);

  // Charger les réponses quand un ticket est sélectionné
  useEffect(() => {
    if (selectedTicket) {
      fetchTicketResponses(selectedTicket.id);
    } else {
      setTicketResponses([]);
    }
  }, [selectedTicket, fetchTicketResponses]);

  // Envoi d'une réponse utilisateur
  const handleSendTicketReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketReply.trim() || !selectedTicket || !user) return;
    setIsSendingReply(true);
    try {
      const { error } = await supabase.from('support_ticket_responses').insert([
        {
          ticket_id: selectedTicket.id,
          user_id: user.id,
          message: ticketReply.trim(),
          is_admin: false,
        },
      ]);
      if (error) {
        toast.error("Erreur lors de l'envoi de la réponse");
        return;
      }
      setTicketReply('');
      fetchTicketResponses(selectedTicket.id);
    } finally {
      setIsSendingReply(false);
    }
  };

  // Subscription temps réel sur les réponses du ticket sélectionné (hook à la racine)
  useRealtimeSubscription({
    channelName: selectedTicket ? `ticket_responses_${selectedTicket.id}` : 'ticket_responses_none',
    table: 'support_ticket_responses',
    event: 'INSERT',
    onMessage: (payload) => {
      if (selectedTicket) {
        fetchTicketResponses(selectedTicket.id);
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.play();
        }
      }
    },
  });

  // Scroll auto sur les réponses utilisateur (tickets)
  useEffect(() => {
    if (responsesEndRef.current) {
      responsesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [ticketResponses]);

  return (
    <section className="container mx-auto py-8" aria-labelledby="support-title">
      <h2 id="support-title" className="text-3xl font-bold mb-6 text-center text-gray-900 dark:text-white">Centre d'assistance</h2>

      {/* Affichage des erreurs */}
      {renderError()}

      <Tabs value={tabValue} onValueChange={setTabValue} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="faq" className="flex items-center gap-2">
            <FileQuestion className="h-4 w-4" />
            <span className="font-medium text-primary">FAQ</span>
          </TabsTrigger>
          <TabsTrigger value="tickets" className="flex items-center gap-2">
            <LifeBuoy className="h-4 w-4" />
            <span className="font-medium text-primary">Tickets</span>
          </TabsTrigger>
          <TabsTrigger value="chat" className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            <span className="font-medium text-primary">Chat en ligne</span>
          </TabsTrigger>
          <TabsTrigger value="docs" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="font-medium text-primary">Documentation</span>
          </TabsTrigger>
        </TabsList>

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
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span>Chargement des FAQ...</span>
                  </div>
                </div>
              ) : faqs.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <FileQuestion className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Aucune FAQ disponible pour le moment</p>
                  <p className="text-sm mt-2">Notre équipe prépare les réponses aux questions les plus courantes.</p>
                </div>
              ) : (
                <Accordion type="single" collapsible className="w-full">
                  {faqs.map((faq) => (
                    <AccordionItem key={faq.id} value={`item-${faq.id}`}>
                      <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                      <AccordionContent>{faq.answer}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <p className="text-sm text-muted-foreground">Vous n'avez pas trouvé votre réponse ?</p>
              <Button 
                variant="outline" 
                onClick={() => {
                  setTabValue('tickets');
                  setShowTicketForm(true);
                  setTicketSubmitted(false);
                  setSelectedTicket(null);
                }}
              >
                Créer un ticket
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="tickets" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
              <CardTitle>Système de tickets</CardTitle>
              <CardDescription>
                Créez un ticket pour obtenir de l'aide personnalisée de notre équipe.
              </CardDescription>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Wifi className="h-4 w-4 mr-2" />
                      Test Realtime
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Test Configuration Realtime</DialogTitle>
                      <DialogDescription>
                        Vérifiez et corrigez automatiquement la configuration des notifications temps réel
                      </DialogDescription>
                    </DialogHeader>
                    <RealtimeConfigTester 
                      onConfigFixed={() => {
                        toast.success('Configuration corrigée ! Rechargez la page pour tester les notifications.');
                      }}
                    />
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {showTicketForm ? (
                <div className="bg-amber-50 border border-amber-200 rounded-md p-4 text-amber-800">
                  <h3 className="font-medium">Création de ticket</h3>
                  <form onSubmit={handleCreateTicket} className="mt-4 flex flex-col gap-2">
                    <Input
                      placeholder="Sujet du ticket"
                      value={newTicketSubject}
                      onChange={(e) => setNewTicketSubject(e.target.value)}
                    />
                    <Textarea
                      placeholder="Description du ticket"
                      value={newTicketMessage}
                      onChange={(e) => setNewTicketMessage(e.target.value)}
                      rows={3}
                    />
                    <Button type="submit" disabled={isSubmittingTicket}>
                      {isSubmittingTicket ? 'Envoi en cours...' : 'Créer le ticket'}
                    </Button>
                  </form>
                </div>
              ) : ticketSubmitted ? (
                <div className="bg-green-50 border border-green-200 rounded-md p-4 text-green-800">
                  <h3 className="font-medium">Ticket soumis avec succès !</h3>
                  <p className="mt-2">Notre équipe vous répondra dans les 24 heures ouvrées. Vous recevrez une notification par email.</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => { setShowTicketForm(true); setTicketSubmitted(false); setSelectedTicket(null); }}
                  >
                    Créer un nouveau ticket
                  </Button>
                </div>
              ) : (
                <div className="flex h-[600px] border rounded-lg overflow-hidden">
                  {/* Colonne de gauche - Liste des tickets */}
                  <div className="w-1/3 border-r bg-gray-50 overflow-y-auto">
                    <div className="p-4 border-b bg-white">
                      <h3 className="font-bold text-lg">Vos tickets</h3>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2 w-full"
                        onClick={() => { setShowTicketForm(true); setTicketSubmitted(false); setSelectedTicket(null); }}
                      >
                        Nouveau ticket
                      </Button>
                    </div>
                    
                    {isLoadingTickets ? (
                      <div className="flex justify-center items-center h-32">
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-6 w-6 animate-spin" />
                          <span>Chargement...</span>
                        </div>
                      </div>
                    ) : userTickets.length === 0 ? (
                      <div className="p-4 text-gray-500">
                        <p>Aucun ticket trouvé</p>
                        <p className="text-sm mt-2">Créez votre premier ticket pour obtenir de l'aide.</p>
                      </div>
                    ) : (
                      <ul>
                        {userTickets.map((ticket) => (
                          <li
                            key={ticket.id}
                            className={`p-4 border-b cursor-pointer hover:bg-gray-100 ${selectedTicket?.id === ticket.id ? 'bg-gray-200' : ''}`}
                            onClick={() => setSelectedTicket(ticket)}
                          >
                            <div className="font-medium">{ticket.subject}</div>
                            <div className="text-xs text-gray-500 truncate">{ticket.message}</div>
                            <div className="text-xs text-gray-400">{new Date(ticket.created_at).toLocaleString('fr-FR')}</div>
                            <span className={`text-xs px-2 py-1 rounded-full border ${ticket.status === 'open' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                              ticket.status === 'in_progress' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                              ticket.status === 'resolved' ? 'bg-green-50 text-green-700 border-green-200' :
                              'bg-gray-50 text-gray-700 border-gray-200'
                            }`}>
                              {ticket.status === 'open' ? 'Ouvert' :
                                ticket.status === 'in_progress' ? 'En cours' :
                                ticket.status === 'resolved' ? 'Résolu' :
                                ticket.status === 'closed' ? 'Fermé' : ticket.status}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Colonne de droite - Détails du ticket */}
                  <div className="flex-1 p-4 bg-white">
                    {selectedTicket ? (
                      <div>
                        <h3 className="text-lg font-semibold mb-4">{selectedTicket.subject}</h3>
                        <p className="text-gray-600 mb-4">{selectedTicket.message}</p>
                        <div className="text-sm text-gray-500 mb-2">
                          Créé le {new Date(selectedTicket.created_at).toLocaleString('fr-FR')}
                        </div>
                        {/* Historique des réponses */}
                        <div className="my-4 space-y-3" style={{maxHeight: 400, overflowY: 'auto'}}>
                          {ticketResponses.length === 0 ? (
                            <div className="text-gray-400 text-sm">Aucune réponse pour ce ticket.</div>
                          ) : (
                            ticketResponses.map((resp) => (
                              <div key={resp.id} className={`flex ${resp.is_admin ? 'justify-start' : 'justify-end'}`}>
                                <div className={`max-w-[80%] px-4 py-2 rounded-2xl shadow-sm ${resp.is_admin ? 'bg-gray-100 text-gray-900' : 'bg-primary text-white'}`}>
                                  <p className="whitespace-pre-wrap break-words text-base">{resp.message}</p>
                                  <p className={`text-xs mt-1 text-right opacity-60 ${resp.is_admin ? 'text-gray-500' : 'text-primary-100'}`}>
                                    {resp.is_admin ? 'Support' : 'Vous'} • {new Date(resp.created_at).toLocaleString('fr-FR')}
                                  </p>
                                </div>
                              </div>
                            ))
                          )}
                          <div ref={responsesEndRef} />
                        </div>
                        {/* Champ de réponse utilisateur */}
                        {selectedTicket.status !== 'closed' && selectedTicket.status !== 'resolved' && (
                          <form onSubmit={handleSendTicketReply} className="flex gap-2 mt-4">
                            <Input
                              placeholder="Votre réponse..."
                              value={ticketReply}
                              onChange={(e) => setTicketReply(e.target.value)}
                              disabled={isSendingReply}
                            />
                            <Button type="submit" disabled={isSendingReply || !ticketReply.trim()}>
                              {isSendingReply ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                            </Button>
                          </form>
                        )}
                      </div>
                    ) : (
                      <div className="text-center text-gray-500 py-8">
                        <LifeBuoy className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>Sélectionnez un ticket pour voir les détails</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chat" className="mt-6">
          <Card>
            <CardHeader className="sticky top-0 z-10 bg-white border-b shadow-sm flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <MessageCircle className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="font-bold text-lg text-gray-900">Support équipe</div>
                  <div className="text-xs text-green-600">En ligne</div>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="ml-auto"
                onClick={handleNewChatSession}
              >
                Nouvelle conversation
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {isLoadingChat ? (
                <div className="flex justify-center items-center h-80">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="flex flex-col md:flex-row h-[600px] border rounded-lg overflow-hidden bg-white">
                  {/* Colonne de gauche - Historique des sessions */}
                  <div className="w-full md:w-1/3 border-r bg-gray-50 overflow-y-auto">
                    <div className="p-4 border-b bg-white sticky top-0 z-10">
                      <h3 className="font-bold text-lg">Conversations</h3>
                    </div>
                    {sessionsForHistory.length === 0 ? (
                      <div className="p-4 text-gray-500">
                        <p>Aucune conversation</p>
                        <p className="text-sm mt-2">Démarrez une nouvelle conversation pour obtenir de l'aide.</p>
                      </div>
                    ) : (
                      <ul>
                        {sessionsForHistory.map((session) => (
                          <li
                            key={session.id}
                            className={`p-4 mb-2 mx-2 rounded-xl cursor-pointer transition-colors border border-transparent ${selectedSession?.id === session.id ? 'bg-primary/10 border-primary' : 'hover:bg-gray-100'}`}
                            onClick={() => setSelectedSession(session)}
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900">{session.status === 'open' ? '🟢' : '⚪'} Conversation</span>
                              {session.status === 'open' ? (
                                <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Ouverte</span>
                              ) : (
                                <span className="ml-2 text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">Terminée</span>
                              )}
                            </div>
                            <div className="text-xs text-gray-400 mt-1">{new Date(session.created_at).toLocaleString('fr-FR')}</div>
                            {session.rating && (
                              <div className="flex items-center gap-1 mt-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <span key={star} className={star <= session.rating! ? 'text-yellow-400' : 'text-gray-300'}>★</span>
                                ))}
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Colonne de droite - Messages */}
                  <div className="flex-1 flex flex-col bg-white relative">
                    {selectedSession ? (
                      <>
                        {/* Header sticky session */}
                        <div className="sticky top-0 z-10 p-4 border-b bg-white flex flex-col md:flex-row md:items-center md:justify-between">
                          <div className="font-semibold text-base text-gray-900">Conversation #{selectedSession.id.slice(-8)}</div>
                          <div className="flex items-center gap-2 mt-2 md:mt-0">
                            {selectedSession.status === 'open' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handleEndSession}
                              >
                                Terminer
                              </Button>
                            )}
                            <span className="text-xs text-gray-500 ml-2">{selectedSession.status === 'open' ? 'En cours' : 'Terminée'} • {new Date(selectedSession.created_at).toLocaleString('fr-FR')}</span>
                          </div>
                        </div>
                        {/* Zone des messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50 to-white">
                          {messagesForSelectedSession.length === 0 ? (
                            <div className="text-center text-gray-400 py-8">
                              <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-200" />
                              <p className="font-medium">Commencez la conversation !</p>
                              <p className="text-sm mt-2">Posez votre question, notre équipe vous répondra rapidement.</p>
                            </div>
                          ) : (
                            messagesForSelectedSession.map((message) => (
                              <div
                                key={message.id}
                                className={`flex ${message.is_admin ? 'justify-start' : 'justify-end'} animate-fade-in`}
                              >
                                <div
                                  className={`max-w-[80%] px-4 py-2 rounded-2xl shadow-md transition-all duration-200 ${message.is_admin ? 'bg-gray-100 text-gray-900' : 'bg-primary text-white'}`}
                                >
                                  <p className="whitespace-pre-wrap break-words text-base">{message.message}</p>
                                  <p className={`text-xs mt-1 text-right opacity-60 ${message.is_admin ? 'text-gray-500' : 'text-primary-100'}`}>
                                    {message.is_admin ? 'Support' : 'Vous'} • {new Date(message.created_at).toLocaleString('fr-FR')}
                                  </p>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                        {/* Zone de notation */}
                        {showRating && (
                          <div className="p-4 border-t bg-yellow-50">
                            <h4 className="font-medium mb-2">Comment évaluez-vous cette conversation ?</h4>
                            <div className="flex items-center gap-2">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  onClick={() => handleRating(star)}
                                  className={`text-2xl ${star <= rating ? 'text-yellow-400' : 'text-gray-300'} hover:text-yellow-400 transition-colors`}
                                >
                                  ★
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                        {/* Formulaire d'envoi */}
                        {selectedSession.status === 'open' && !showRating && (
                          <form onSubmit={handleChatSubmit} className="p-4 border-t bg-white sticky bottom-0 z-10">
                            <div className="flex gap-2">
                              <Input
                                placeholder="Tapez votre message..."
                                value={chatMessage}
                                onChange={(e) => setChatMessage(e.target.value)}
                                disabled={isLoading}
                                className="rounded-full px-4 py-2 shadow-sm focus:ring-2 focus:ring-primary/50"
                              />
                              <Button type="submit" disabled={isLoading || !chatMessage.trim()} className="rounded-full px-4">
                                {isLoading ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Send className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </form>
                        )}
                      </>
                    ) : (
                      <div className="flex-1 flex items-center justify-center">
                        <div className="text-center text-gray-400">
                          <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-200" />
                          <p className="font-medium">Sélectionnez une conversation pour commencer</p>
                          <p className="text-sm mt-2">Ou créez une nouvelle conversation.</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

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
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span>Chargement de la documentation...</span>
                  </div>
                </div>
              ) : kbArticles.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Aucune documentation disponible pour le moment</p>
                  <p className="text-sm mt-2">Notre équipe prépare la documentation complète.</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {kbArticles.map((article) => (
                    <div key={article.id} className="border rounded-lg p-4">
                      <h3 className="font-semibold text-lg mb-2">{article.title}</h3>
                      <p className="text-gray-600 mb-3">{article.description}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedKbArticle(article);
                          setShowKbModal(true);
                        }}
                      >
                        Consulter
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal pour afficher la documentation */}
      {showKbModal && selectedKbArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full p-0 relative" style={{ maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <div className="sticky top-0 z-10 bg-white p-6 rounded-t-lg border-b flex flex-col">
              <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-800" onClick={() => setShowKbModal(false)}>
                <X className="h-5 w-5" />
              </button>
              <h2 className="text-2xl font-bold mb-2 pr-8">{selectedKbArticle.title}</h2>
              <div className="mb-2 text-sm text-gray-500">
                Catégorie : <span className="font-medium">{selectedKbArticle.category}</span>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {String(selectedKbArticle.content || '')}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      )}

      {/* Ajoute l'élément audio caché pour notification */}
      <audio ref={audioRef} src="/notification.mp3" preload="auto" style={{ display: 'none' }} />
    </section>
  );
};