import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, Send, MessageCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useRealtimeSubscription } from '../../../hooks/useRealtimeSubscription';

interface ChatUser {
    user_id: string;
    last_message: string;
    last_date: string;
    full_name: string | null;
    email: string | null;
    avatar_url: string | null;
}

interface ChatMessage {
    id: string;
    session_id: string; // <-- cette ligne est OBLIGATOIRE
    user_id: string;
    message: string;
    is_admin: boolean;
    is_read: boolean;
    created_at: string;
    profile?: {
        full_name: string;
        email: string;
        avatar_url?: string;
    };
}

export const AdminSupportChat = () => {
    const [users, setUsers] = useState<ChatUser[]>([]);
    const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);
    const [sessions, setSessions] = useState<any[]>([]); // sessions de l'utilisateur sélectionné
    const [selectedSession, setSelectedSession] = useState<any | null>(null); // session sélectionnée
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [reply, setReply] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingUsers, setIsLoadingUsers] = useState(false);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    
    // Refs pour éviter les re-renders inutiles
    const usersIntervalRef = useRef<NodeJS.Timeout | null>(null);
    // Ajout du son de notification
    const notificationAudioRef = useRef<HTMLAudioElement | null>(null);

    // Charger la liste des utilisateurs ayant envoyé des messages
    const fetchUsers = useCallback(async () => {
        try {
            setIsLoadingUsers(true);
            const { data, error } = await supabase.rpc('get_support_chat_users');
            if (error) {
                toast.error("Erreur lors du chargement des utilisateurs");
                return;
            }
            setUsers(data || []);
            // Sélectionner le premier utilisateur par défaut seulement si aucun n'est sélectionné
            if (!selectedUser && data && data.length > 0) {
                setSelectedUser(data[0]);
            }
        } catch (err) {
            toast.error("Erreur inattendue");
        } finally {
            setIsLoadingUsers(false);
        }
    }, []);

    // Charger toutes les sessions d'un utilisateur
    const fetchSessionsAndMessages = useCallback(async (user: ChatUser | null) => {
        if (!user || !user.user_id) {
            setSessions([]);
            setSelectedSession(null);
            setMessages([]);
            return;
        }
        if (user.user_id.startsWith('support_guest_')) {
            // Guest: pas de notion de session, on récupère tous les messages de ce user_id
            setSessions([]);
            setSelectedSession(null);
            setIsLoadingMessages(true);
            try {
                const { data, error } = await supabase
                    .from('support_chat_messages')
                    .select('*')
                    .eq('user_id', user.user_id)
                    .order('created_at', { ascending: true });
                if (error) {
                    toast.error("Erreur lors du chargement des messages");
                    setMessages([]);
                    return;
                }
                setMessages(data || []);
                console.log('[AdminSupportChat] Messages récupérés pour la session', user.user_id, ':', (data || []).length, data || []);
            } catch (err) {
                toast.error("Erreur inattendue");
                setMessages([]);
            } finally {
                setIsLoadingMessages(false);
            }
        } else {
            // Utilisateur authentifié: charger les sessions puis les messages de la session sélectionnée
            try {
                const { data: sessionsData, error: sessionError } = await supabase
                    .from('support_chat_sessions')
                    .select('*')
                    .eq('user_id', user.user_id)
                    .order('created_at', { ascending: false });
                if (sessionError || !sessionsData || sessionsData.length === 0) {
                    setSessions([]);
                    setSelectedSession(null);
                    setMessages([]);
                    return;
                }
                setSessions(sessionsData);
                setSelectedSession(sessionsData[0]); // Par défaut, la plus récente
            } catch (err) {
                setSessions([]);
                setSelectedSession(null);
                setMessages([]);
            }
        }
    }, []);

    // Initialisation - charger les utilisateurs une seule fois
    useEffect(() => {
        fetchUsers();
        
        // Démarrer l'intervalle pour les utilisateurs (rafraîchissement toutes les 60 secondes)
        usersIntervalRef.current = setInterval(fetchUsers, 60000);
        
        return () => {
            if (usersIntervalRef.current) {
                clearInterval(usersIntervalRef.current);
            }
        };
    }, []); // Dépendances vides pour ne s'exécuter qu'une fois

    // 1. Sélection automatique du premier utilisateur et restauration depuis localStorage
    useEffect(() => {
        // Restaure le dernier utilisateur sélectionné si présent
        const lastUserId = localStorage.getItem('admin_selected_user_id');
        if (users.length > 0) {
            if (!selectedUser || !users.some(u => u.user_id === selectedUser.user_id)) {
                // Si un user_id mémorisé existe dans la liste, le sélectionner
                if (lastUserId && users.some(u => u.user_id === lastUserId)) {
                    setSelectedUser(users.find(u => u.user_id === lastUserId) || users[0]);
                } else {
                    setSelectedUser(users[0]);
                }
            }
        } else {
            setSelectedUser(null);
            setSessions([]);
            setSelectedSession(null);
            setMessages([]);
        }
    }, [users]);

    // 2. Mémoriser le dernier utilisateur sélectionné
    useEffect(() => {
        if (selectedUser) {
            localStorage.setItem('admin_selected_user_id', selectedUser.user_id);
            fetchSessionsAndMessages(selectedUser);
        }
    }, [selectedUser, fetchSessionsAndMessages]);

    // 3. Sélection automatique de la session la plus récente après chargement des sessions
    useEffect(() => {
        if (sessions.length > 0 && (!selectedSession || !sessions.some(s => s.id === selectedSession.id))) {
            setSelectedSession(sessions[0]);
        }
    }, [sessions]);

    // Charger les messages à chaque changement de session sélectionnée
    useEffect(() => {
        if (!selectedUser || selectedUser.user_id.startsWith('support_guest_')) return;
        if (!selectedSession || !selectedSession.id) {
            setMessages([]);
            return;
        }
        const fetch = async () => {
            setIsLoadingMessages(true);
            try {
                const { data, error } = await supabase
                    .from('support_chat_messages')
                    .select('*')
                    .eq('session_id', selectedSession.id)
                    .order('created_at', { ascending: true });
                if (error) {
                    toast.error("Erreur lors du chargement des messages");
                    setMessages([]);
                } else {
                    setMessages(data || []);
                    console.log('[AdminSupportChat] Messages récupérés pour la session', selectedSession?.id, ':', (data || []).length, data || []);
                }
            } catch {
                toast.error("Erreur inattendue");
                setMessages([]);
            } finally {
                setIsLoadingMessages(false);
            }
        };
        fetch();
    }, [selectedSession, selectedUser]);

    // Mémoriser la session sélectionnée
    useEffect(() => {
        if (selectedSession) {
            // Ici, tu peux mémoriser la session si besoin
        }
    }, [selectedSession]);

    // Abonnement Realtime pour notifications tickets/réponses
    useRealtimeSubscription({
        channelName: 'realtime_support_chat_admin',
        table: 'support_chat_messages',
        event: 'INSERT',
        onMessage: (payload) => {
            console.log('[AdminSupportChat] Nouveau message reçu:', payload.new);
            // Ne pas notifier si c'est l'admin qui a envoyé le message
            if (payload.new.is_admin) {
                console.log('[AdminSupportChat] Message admin - pas de notification');
                return;
            }
            if (!payload.new.is_admin) {
                console.log('[AdminSupportChat] Notification sonore: tentative de lecture du son');
                if (notificationAudioRef.current) {
                    try {
                        notificationAudioRef.current.currentTime = 0;
                        notificationAudioRef.current.play().then(() => {
                            console.log('[AdminSupportChat] Son joué avec succès');
                        }).catch((e) => {
                            console.warn('[AdminSupportChat] Erreur lecture son:', e);
                        });
                    } catch (e) {
                        console.warn('[AdminSupportChat] Exception lecture son:', e);
                    }
                }
                toast.info('💬 Nouveau message utilisateur !', {
                    description: `Session: ${payload.new.session_id}`,
                    duration: 0, // Le toast reste jusqu'à validation manuelle
                    action: {
                        label: 'Voir',
                        onClick: () => {
                            fetchUsers();
                            if (selectedUser && payload.new.user_id === selectedUser.user_id) {
                                fetchSessionsAndMessages(selectedUser);
                            }
                        }
                    }
                });
            }
        },
        onError: (error) => {
            console.error('[AdminSupportChat] Erreur abonnement:', error);
            toast.error('Erreur de configuration des notifications');
        },
        onStatusChange: (status) => {
            console.log('[AdminSupportChat] Statut abonnement chat:', status);
        }
    });

    // Envoyer une réponse
    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reply.trim() || !selectedUser || !selectedSession) return;
        try {
            setIsLoading(true);
            const { data: { user: adminUser } } = await supabase.auth.getUser();
            if (!adminUser) {
                toast.error("Admin non authentifié");
                return;
            }
            console.log('[AdminSupportChat] Envoi message admin', {
                user_id: adminUser.id,
                session_id: selectedSession.id,
                message: reply,
                is_admin: true
            });
            const { error } = await supabase.from('support_chat_messages').insert([
                {
                    user_id: adminUser.id,
                    session_id: selectedSession.id,
                    message: reply,
                    is_admin: true,
                    is_read: false,
                },
            ]);
            if (error) {
                toast.error("Erreur lors de l'envoi du message");
                return;
            }
            setReply('');
            toast.success("Message envoyé avec succès");
            await fetchSessionsAndMessages(selectedUser);
        } catch (err) {
            toast.error("Erreur inattendue");
        } finally {
            setIsLoading(false);
        }
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleString('fr-FR', {
            day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit'
        });
    };

    // Fonction pour supprimer une session (et ses messages)
    const handleDeleteSession = async () => {
        if (!selectedSession) return;
        if (!window.confirm('Voulez-vous vraiment supprimer cette conversation et tous ses messages ?')) return;
        setIsLoading(true);
        try {
            // Supprimer les messages de la session
            const { error: msgError } = await supabase
                .from('support_chat_messages')
                .delete()
                .eq('session_id', selectedSession.id);
            if (msgError) throw msgError;
            // Supprimer la session
            const { error: sessError } = await supabase
                .from('support_chat_sessions')
                .delete()
                .eq('id', selectedSession.id);
            if (sessError) throw sessError;
            toast.success('Conversation supprimée avec succès');
            // Rafraîchir les sessions et messages
            fetchSessionsAndMessages(selectedUser);
        } catch (err) {
            toast.error('Erreur lors de la suppression');
        } finally {
            setIsLoading(false);
        }
    };

    // Filtrer les sessions pour n'afficher que celles qui ont au moins un message
    const sessionsWithMessages = sessions.filter(s => messages.some(m => m.session_id === s.id));

    // Fonction pour supprimer un utilisateur du chat (et tout son historique)
    const handleDeleteUser = async (user: ChatUser) => {
        if (!window.confirm('Voulez-vous vraiment supprimer cet utilisateur du chat et tout son historique ?')) return;
        setIsLoading(true);
        try {
            // Supprimer tous les messages de l'utilisateur
            const { error: msgError } = await supabase
                .from('support_chat_messages')
                .delete()
                .eq('user_id', user.user_id);
            if (msgError) throw msgError;
            // Supprimer toutes les sessions de l'utilisateur
            const { error: sessError } = await supabase
                .from('support_chat_sessions')
                .delete()
                .eq('user_id', user.user_id);
            if (sessError) throw sessError;
            // (Optionnel) Supprimer tous les tickets de l'utilisateur
            await supabase
                .from('support_tickets')
                .delete()
                .eq('user_id', user.user_id);
            // (Optionnel) Supprimer le profil si c'est un guest
            if (user.user_id.startsWith('support_guest_')) {
                await supabase
                    .from('profiles')
                    .delete()
                    .eq('id', user.user_id);
            }
            toast.success('Utilisateur supprimé du chat avec succès');
            // Rafraîchir la liste des utilisateurs
            fetchUsers();
            setSelectedUser(null);
            setSessions([]);
            setSelectedSession(null);
            setMessages([]);
        } catch (err) {
            toast.error('Erreur lors de la suppression de l\'utilisateur');
        } finally {
            setIsLoading(false);
        }
    };

    // Ajout du son de notification
    useEffect(() => {
        notificationAudioRef.current = new window.Audio('/notification.mp3');
    }, []);

    return (
        <div className="flex flex-col md:flex-row h-[700px] border rounded-lg overflow-hidden bg-white shadow-md">
            {/* Colonne de gauche - Utilisateurs */}
            <aside className="w-full md:w-80 border-r bg-gray-50 flex flex-col">
                <div className="p-4 border-b bg-white sticky top-0 z-10 flex items-center justify-between">
                    <h2 className="font-bold text-lg">Utilisateurs</h2>
                </div>
                {isLoadingUsers ? (
                    <div className="flex-1 flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                ) : users.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center text-gray-500">
                        Aucun utilisateur trouvé
                    </div>
                ) : (
                    <ul className="flex-1 overflow-y-auto divide-y">
                        {users.map((u) => {
                            const isGuest = u.user_id.startsWith('support_guest_');
                            const displayName = isGuest ? 'Invité' : (u.full_name && u.full_name !== 'Invité' ? u.full_name : 'Utilisateur');
                            const displayEmail = isGuest ? 'Utilisateur anonyme' : (u.email || 'Utilisateur anonyme');
                            return (
                                <li
                                    key={u.user_id}
                                    className={`flex items-center gap-3 px-4 py-3 mb-2 mx-2 rounded-xl cursor-pointer transition-colors border border-transparent ${selectedUser?.user_id === u.user_id ? 'bg-primary/10 border-primary' : 'hover:bg-gray-100'}`}
                                    onClick={() => setSelectedUser(u)}
                                >
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage src={u.avatar_url || undefined} />
                                        <AvatarFallback>
                                            {displayName[0] || 'U'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className="font-semibold truncate text-gray-900 block max-w-[120px]">{displayName}</span>
                                            {isGuest && (
                                                <Badge variant="secondary" className="ml-1 text-xs">Invité</Badge>
                                            )}
                                        </div>
                                        <span className="text-xs text-gray-500 truncate block max-w-[160px]">{displayEmail}</span>
                                        <span className="text-xs text-gray-700 truncate block max-w-[180px] mt-1">{u.last_message?.slice(0, 40) || <span className="italic text-gray-400">Aucun message</span>}</span>
                                    </div>
                                    <span className="text-xs text-gray-400 ml-2 whitespace-nowrap">{u.last_date ? formatDate(u.last_date) : ''}</span>
                                    {/* Bouton suppression utilisateur */}
                                    <button
                                        className="ml-2 px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 border border-red-300"
                                        onClick={e => { e.stopPropagation(); handleDeleteUser(u); }}
                                        disabled={isLoading}
                                        type="button"
                                        title="Supprimer cet utilisateur du chat"
                                    >
                                        ✕
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </aside>
            {/* Chat principal */}
            <section className="flex-1 flex flex-col bg-white relative">
                {selectedUser ? (
                    <>
                        {/* Header sticky session */}
                        <div className="sticky top-0 z-10 p-4 border-b bg-white flex flex-col md:flex-row md:items-center md:justify-between">
                            <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src={selectedUser.avatar_url || undefined} />
                                    <AvatarFallback>{selectedUser.full_name?.[0] || 'U'}</AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                    <div className="font-semibold text-base text-gray-900 truncate">{selectedUser.full_name || 'Utilisateur'}</div>
                                    <div className="text-xs text-gray-500 truncate">{selectedUser.email || 'Utilisateur anonyme'}</div>
                                    {selectedUser.user_id.startsWith('support_guest_') && (
                                        <Badge variant="secondary" className="ml-1 text-xs">Invité</Badge>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-2 mt-2 md:mt-0">
                                {selectedSession && (
                                    <>
                                        {sessionsWithMessages.length > 1 && (
                                            <select
                                                className="border rounded px-2 py-1 text-sm"
                                                value={selectedSession?.id || ''}
                                                onChange={e => {
                                                    const session = sessionsWithMessages.find(s => s.id === e.target.value);
                                                    setSelectedSession(session || null);
                                                }}
                                            >
                                                {sessionsWithMessages.map(s => {
                                                    const firstMsg = messages.find(m => m.session_id === s.id);
                                                    return (
                                                        <option key={s.id} value={s.id}>
                                                            {firstMsg ? new Date(firstMsg.created_at).toLocaleString('fr-FR') : 'Session'}
                                                        </option>
                                                    );
                                                })}
                                            </select>
                                        )}
                                        <button
                                            className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 border border-red-300"
                                            onClick={handleDeleteSession}
                                            disabled={isLoading}
                                            type="button"
                                        >
                                            Supprimer cette conversation
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                        {/* Zone des messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50 to-white">
                            {isLoadingMessages ? (
                                <div className="flex items-center justify-center h-full text-gray-500">
                                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                </div>
                            ) : selectedUser && selectedUser.user_id.startsWith('support_guest_') ? (
                                <div className="flex items-center justify-center h-full text-gray-400 italic">
                                    Aucun message pour cet utilisateur invité
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="flex items-center justify-center h-full text-gray-400 italic">
                                    Aucun message pour cet utilisateur
                                </div>
                            ) : (
                                messages.map((msg) => (
                                    <div key={msg.id} className={`flex ${msg.is_admin ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                                        <div className={`max-w-[80%] px-4 py-2 rounded-2xl shadow-md transition-all duration-200 ${msg.is_admin ? 'bg-primary text-white ml-auto' : 'bg-gray-100 text-gray-900'}`}>
                                            <div className="whitespace-pre-wrap break-words text-base">{msg.message}</div>
                                            <div className={`text-xs mt-1 text-right opacity-60 ${msg.is_admin ? 'text-primary-100' : 'text-gray-500'}`}>
                                                {msg.is_admin ? 'Support' : 'Utilisateur'} • {formatDate(msg.created_at)}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        {/* Formulaire d'envoi */}
                        {selectedSession && selectedSession.status === 'open' && (
                            <form onSubmit={handleSend} className="p-4 border-t bg-white sticky bottom-0 z-10">
                                <div className="flex gap-2">
                                    <Input
                                        value={reply}
                                        onChange={(e) => setReply(e.target.value)}
                                        placeholder="Votre réponse..."
                                        className="flex-1 rounded-full px-4 py-2 shadow-sm focus:ring-2 focus:ring-primary/50"
                                        disabled={isLoading}
                                    />
                                    <Button type="submit" disabled={isLoading || !reply.trim()} className="rounded-full px-4">
                                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                    </Button>
                                </div>
                            </form>
                        )}
                        {selectedSession && selectedSession.status !== 'open' && (
                            <div className="p-4 border-t bg-gray-50 text-center text-gray-500 text-sm sticky bottom-0 z-10">
                                Conversation terminée, vous ne pouvez plus répondre.
                            </div>
                        )}
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center text-gray-400">
                            <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-200" />
                            <p className="font-medium">Sélectionnez un utilisateur pour commencer</p>
                            <p className="text-sm mt-2">Ou attendez qu'un utilisateur démarre une conversation.</p>
                        </div>
                    </div>
                )}
            </section>
        </div>
    );
}

export default AdminSupportChat;