import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { AdminSupportService } from '@/services/adminSupportService';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useRealtimeSubscription } from '../../../hooks/useRealtimeSubscription';
// Logger supprimé - utilisation de console directement
interface Ticket {
    id: string;
    user_id: string;
    subject: string;
    message: string;
    status: string;
    created_at: string;
}

interface TicketResponse {
    id: string;
    ticket_id: string;
    user_id: string;
    message: string;
    is_admin: boolean;
    created_at: string;
}

export const AdminSupportTickets = () => {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [responses, setResponses] = useState<TicketResponse[]>([]);
    const [reply, setReply] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('open');
    const [isReplying, setIsReplying] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [debugInfo, setDebugInfo] = useState<any>(null);
    const [isLoadingTickets, setIsLoadingTickets] = useState(false);
    const [isLoadingResponses, setIsLoadingResponses] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const responsesEndRef = useRef<HTMLDivElement | null>(null);

    // Fonction pour charger les tickets (extraitée pour être réutilisable)
    const fetchTickets = useCallback(async () => {
        try {
            setIsLoadingTickets(true);
            setError(null);
            const data = await AdminSupportService.getTickets();
            setTickets(data);
        } catch (err) {
            console.error('[AdminSupportTickets] Erreur inattendue:', err);
            setError(`Erreur inattendue: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
            toast.error('Erreur inattendue');
        } finally {
            setIsLoadingTickets(false);
        }
    }, []);

    // Fonction pour charger les réponses (extraitée pour être réutilisable)
    const fetchResponses = useCallback(async (ticketId: string) => {
        try {
            setIsLoadingResponses(true);
            setError(null);
            const data = await AdminSupportService.getTicketResponses(ticketId);
            setResponses(data);
        } catch (err) {
            console.error('[AdminSupportTickets] Erreur inattendue:', err);
            setError(`Erreur inattendue: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
            toast.error('Erreur inattendue');
        } finally {
            setIsLoadingResponses(false);
        }
    }, []);

    // Charger tous les tickets (au montage uniquement)
    useEffect(() => {
        fetchTickets();
    }, [fetchTickets]);

    // Charger les réponses d'un ticket (à la sélection uniquement)
    useEffect(() => {
        if (!selectedTicket) return;
        fetchResponses(selectedTicket.id);
    }, [selectedTicket, fetchResponses]);

    // Répondre à un ticket
    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reply.trim() || !selectedTicket) return;
        setIsReplying(true);
        try {
            setError(null);
            
            await AdminSupportService.addTicketResponse(selectedTicket.id, reply);
            
            setReply('');
            toast.success("Réponse envoyée avec succès");
            
            // Rafraîchir les réponses immédiatement
            const data = await AdminSupportService.getTicketResponses(selectedTicket.id);
            setResponses(data);
        } catch (error) {
            console.error('[AdminSupportTickets] Erreur inattendue lors de l\'envoi de la réponse:', error);
            setError(`Erreur inattendue: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
            toast.error("Impossible d'envoyer la réponse");
        } finally {
            setIsReplying(false);
        }
    };

    // Changer le statut du ticket
    const handleStatusChange = async (newStatus: string) => {
        if (!selectedTicket) return;
        setLoading(true);
        try {
            setError(null);
            
            await AdminSupportService.updateTicketStatus(selectedTicket.id, newStatus);
            
            setStatus(newStatus);
            toast.success('Statut mis à jour avec succès');
        } catch (error) {
            console.error('[AdminSupportTickets] Erreur inattendue lors du changement de statut:', error);
            setError(`Erreur inattendue: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
            toast.error('Erreur lors du changement de statut');
        } finally {
            setLoading(false);
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
                    {debugInfo && (
                        <details className="mt-2">
                            <summary className="cursor-pointer text-sm">Détails techniques</summary>
                            <pre className="mt-2 text-xs bg-red-100 p-2 rounded overflow-auto">
                                {JSON.stringify(debugInfo, null, 2)}
                            </pre>
                        </details>
                    )}
                </AlertDescription>
            </Alert>
        );
    };

    // Note: L'authentification est maintenant gérée par l'API PostgreSQL
    // L'ID utilisateur est disponible via le token JWT dans les requêtes API

    // Abonnement Realtime pour notifications tickets/réponses
    useRealtimeSubscription({
        channelName: 'realtime_tickets_admin',
        table: 'support_tickets',
        event: 'INSERT',
        onMessage: (payload) => {
            toast.info('🎫 Nouveau ticket reçu !', {
                description: `Sujet: ${payload.new.subject}`,
                duration: 0, // Le toast reste jusqu'à validation manuelle
                action: {
                    label: 'Voir',
                    onClick: () => {
                        fetchTickets(); // Recharge la liste des tickets
                    }
                }
            });
        },
        onError: (error) => {
            console.error('[AdminSupportTickets] Erreur abonnement tickets:', error);
            toast.error('Erreur de configuration des notifications tickets');
        },
        onStatusChange: (status) => {
        }
    });

    useRealtimeSubscription({
        channelName: 'realtime_tickets_update_admin',
        table: 'support_tickets',
        event: 'UPDATE',
        onMessage: (payload) => {
            toast.info('📝 Ticket mis à jour', {
                description: `Statut: ${payload.new.status}`,
                duration: 0, // Le toast reste jusqu'à validation manuelle
                action: {
                    label: 'Actualiser',
                    onClick: () => {
                        fetchTickets(); // Recharge la liste des tickets
                    }
                }
            });
        },
        onError: (error) => {
            console.error('[AdminSupportTickets] Erreur abonnement mises à jour tickets:', error);
        },
        onStatusChange: (status) => {
        }
    });

    useRealtimeSubscription({
        channelName: 'realtime_ticket_responses_admin',
        table: 'support_ticket_responses',
        event: 'INSERT',
        onMessage: (payload) => {
            
            // Ne pas notifier si c'est l'admin qui a envoyé la réponse
            if (payload.new.is_admin) {
                return;
            }
            
            toast.info('💬 Nouvelle réponse utilisateur !', {
                description: `Ticket: ${payload.new.ticket_id}`,
                duration: 0, // Le toast reste jusqu'à validation manuelle
                action: {
                    label: 'Voir',
                    onClick: () => {
                        // Recharge les réponses si le ticket sélectionné est concerné
                        if (selectedTicket && payload.new.ticket_id === selectedTicket.id) {
                            fetchResponses(selectedTicket.id);
                        }
                    }
                }
            });
        },
        onError: (error) => {
            console.error('[AdminSupportTickets] Erreur abonnement réponses:', error);
            toast.error('Erreur de configuration des notifications réponses');
        },
        onStatusChange: (status) => {
        }
    });

    // Subscription temps réel sur les réponses du ticket sélectionné (hook à la racine)
    useRealtimeSubscription({
        channelName: selectedTicket ? `admin_ticket_responses_${selectedTicket.id}` : 'admin_ticket_responses_none',
        table: 'support_ticket_responses',
        event: 'INSERT',
        onMessage: (payload) => {
            if (selectedTicket) {
                fetchResponses(selectedTicket.id);
                if (audioRef.current) {
                    audioRef.current.currentTime = 0;
                    audioRef.current.play();
                }
            }
        },
    });

    // Scroll auto sur les réponses
    useEffect(() => {
        if (responsesEndRef.current) {
            responsesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [responses]);

    return (
        <div className="space-y-4">
            {/* Affichage des erreurs */}
            {renderError()}
            
            <div className="flex h-[600px] border rounded-lg overflow-hidden">
                <div className="w-1/3 border-r bg-gray-50 overflow-y-auto">
                    <h2 className="p-4 font-bold text-lg">Tickets</h2>
                    {isLoadingTickets ? (
                        <div className="flex justify-center items-center h-32">
                            <div className="flex items-center gap-2">
                                <Loader2 className="h-6 w-6 animate-spin" />
                                <span>Chargement...</span>
                            </div>
                        </div>
                    ) : tickets.length === 0 ? (
                        <div className="p-4 text-gray-500">
                            <p>Aucun ticket trouvé</p>
                            <p className="text-sm mt-2">Les tickets apparaîtront ici une fois créés par les utilisateurs.</p>
                        </div>
                    ) : (
                        <ul>
                            {tickets.map((t) => (
                                <li
                                    key={t.id}
                                    className={`p-4 border-b cursor-pointer hover:bg-gray-100 ${selectedTicket?.id === t.id ? 'bg-gray-200' : ''}`}
                                    onClick={() => { setSelectedTicket(t); setStatus(t.status); }}
                                >
                                    <div className="font-medium">{t.subject}</div>
                                    <div className="text-xs text-gray-500 truncate">{t.message}</div>
                                    <div className="text-xs text-blue-600 font-medium">{t.user_email}</div>
                                    <div className="text-xs text-gray-400">{new Date(t.created_at).toLocaleString('fr-FR')}</div>
                                    <span className={`text-xs px-2 py-1 rounded-full border ${t.status === 'open' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                        t.status === 'in_progress' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                            t.status === 'resolved' ? 'bg-green-50 text-green-700 border-green-200' :
                                                'bg-gray-50 text-gray-700 border-gray-200'
                                        }`}>
                                        {t.status === 'open' ? 'Ouvert' :
                                            t.status === 'in_progress' ? 'En cours' :
                                                t.status === 'resolved' ? 'Résolu' :
                                                    t.status === 'closed' ? 'Fermé' : t.status}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                <div className="flex-1 flex flex-col">
                    <div className="flex-1 overflow-y-auto p-4 bg-white">
                        {loading ? (
                            <div className="flex justify-center items-center h-full">
                                <div className="flex items-center gap-2">
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                    <span>Chargement...</span>
                                </div>
                            </div>
                        ) : selectedTicket ? (
                            <>
                                <div className="mb-4">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-lg font-semibold">{selectedTicket.subject}</h3>
                                        <span className={`text-xs px-2 py-1 rounded-full border ${status === 'open' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                            status === 'in_progress' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                                status === 'resolved' ? 'bg-green-50 text-green-700 border-green-200' :
                                                    'bg-gray-50 text-gray-700 border-gray-200'
                                            }`}>
                                            {status === 'open' ? 'Ouvert' :
                                                status === 'in_progress' ? 'En cours' :
                                                    status === 'resolved' ? 'Résolu' :
                                                        status === 'closed' ? 'Fermé' : status}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-600 mt-1">
                                        {new Date(selectedTicket.created_at).toLocaleString('fr-FR')}
                                    </p>
                                    <div className="bg-gray-100 rounded-lg px-4 py-2 mt-2">
                                        <p className="whitespace-pre-wrap text-gray-700">{selectedTicket.message}</p>
                                    </div>
                                    <div className="flex gap-2 mt-2">
                                        <Button size="sm" variant={status === 'open' ? 'default' : 'outline'} onClick={() => handleStatusChange('open')}>Ouvrir</Button>
                                        <Button size="sm" variant={status === 'in_progress' ? 'default' : 'outline'} onClick={() => handleStatusChange('in_progress')}>En cours</Button>
                                        <Button size="sm" variant={status === 'resolved' ? 'default' : 'outline'} onClick={() => handleStatusChange('resolved')}>Résolu</Button>
                                        <Button size="sm" variant={status === 'closed' ? 'default' : 'outline'} onClick={() => handleStatusChange('closed')}>Fermer</Button>
                                    </div>
                                </div>
                                <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                                    {isLoadingResponses ? (
                                        <div className="flex justify-center items-center h-32">
                                            <div className="flex items-center gap-2">
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                <span>Chargement des réponses...</span>
                                            </div>
                                        </div>
                                    ) : responses.length === 0 ? (
                                        <div className="text-center text-gray-500 py-8">
                                            <p>Aucune réponse pour ce ticket</p>
                                        </div>
                                    ) : (
                                        <div className="my-4 space-y-3" style={{maxHeight: 400, overflowY: 'auto'}}>
                                            {responses.map((r) => (
                                                <div key={r.id} className={`${r.is_admin ? 'bg-primary text-white' : 'bg-gray-100'} rounded-lg px-4 py-2 ml-${r.is_admin ? '0' : '4'}`}>
                                                    <p className="whitespace-pre-wrap">{r.message}</p>
                                                    <p className="text-xs mt-1 text-opacity-80">
                                                        {r.is_admin ? 'Support' : 'Utilisateur'} - {new Date(r.created_at).toLocaleString('fr-FR')}
                                                    </p>
                                                </div>
                                            ))}
                                            <div ref={responsesEndRef} />
                                        </div>
                                    )}
                                </div>
                                <form onSubmit={handleSend} className="flex gap-2 mt-2">
                                    <Textarea
                                        value={reply}
                                        onChange={(e) => setReply(e.target.value)}
                                        placeholder="Votre réponse..."
                                        rows={2}
                                        className="flex-1"
                                        disabled={isReplying}
                                    />
                                    <Button type="submit" disabled={isReplying || !reply.trim()}>
                                        {isReplying ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Envoyer'}
                                    </Button>
                                </form>
                            </>
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-500">
                                <p>Sélectionnez un ticket pour voir les détails</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <audio ref={audioRef} src="/notification.mp3" preload="auto" style={{ display: 'none' }} />
        </div>
    );
};

export default AdminSupportTickets; 