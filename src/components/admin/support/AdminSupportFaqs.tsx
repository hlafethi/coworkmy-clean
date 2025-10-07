import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { AdminSupportService } from '@/services/adminSupportService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Plus, Edit, Trash2, Save, X, Loader2, FileQuestion } from "lucide-react";
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';
// Logger supprimé - utilisation de console directement
interface FAQ {
    id: string;
    question: string;
    answer: string;
    category: string;
    order_index: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

const FAQ_CATEGORIES = [
    { value: 'general', label: 'Général' },
    { value: 'reservation', label: 'Réservation' },
    { value: 'paiement', label: 'Paiement' },
    { value: 'acces', label: 'Accès' },
    { value: 'services', label: 'Services' },
    { value: 'compte', label: 'Compte' },
    { value: 'technique', label: 'Technique' }
];

export const AdminSupportFaqs = () => {
    const [faqs, setFaqs] = useState<FAQ[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [newFaq, setNewFaq] = useState({
        question: '',
        answer: '',
        category: 'general',
        order_index: 0,
        is_active: true
    });

    // Fonction pour charger les FAQ
    const fetchFaqs = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await AdminSupportService.getFAQs();
            setFaqs(data);
        } catch (err) {
            setError(`Erreur inattendue: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
            toast.error('Erreur inattendue');
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Charger les FAQ au montage
    useEffect(() => {
        fetchFaqs();
    }, [fetchFaqs]);

    // Abonnement Realtime pour les changements de FAQ
    useRealtimeSubscription({
        channelName: 'realtime_faqs_admin',
        table: 'support_faqs',
        event: '*',
        onMessage: (payload) => {
            console.log('[AdminSupportFaqs] Changement FAQ reçu:', payload);
            toast.info('📝 FAQ mise à jour', {
                description: 'Les FAQ ont été modifiées',
                duration: 3000,
                action: {
                    label: 'Actualiser',
                    onClick: () => {
                        fetchFaqs();
                    }
                }
            });
        },
        onError: (error) => {
            console.error('[AdminSupportFaqs] Erreur abonnement FAQ:', error);
        },
        onStatusChange: (status) => {
            console.log('[AdminSupportFaqs] Statut abonnement FAQ:', status);
        }
    });

    // Créer une nouvelle FAQ
    const handleCreateFaq = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newFaq.question.trim() || !newFaq.answer.trim()) {
            toast.error('Question et réponse obligatoires');
            return;
        }

        setIsLoading(true);
        try {
            const { error } = await supabase
                .from('support_faqs')
                .insert([{
                    question: newFaq.question.trim(),
                    answer: newFaq.answer.trim(),
                    category: newFaq.category,
                    order_index: newFaq.order_index,
                    is_active: newFaq.is_active
                }]);

            if (error) {
                setError(`Erreur lors de la création: ${error.message}`);
                toast.error('Erreur lors de la création de la FAQ');
                return;
            }

            toast.success('✅ FAQ créée avec succès !', {
                description: 'La nouvelle FAQ est maintenant disponible',
                duration: 3000,
            });

            setNewFaq({
                question: '',
                answer: '',
                category: 'general',
                order_index: 0,
                is_active: true
            });
            setShowForm(false);
            await fetchFaqs();
        } catch (err) {
            setError(`Erreur inattendue: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
            toast.error('Erreur inattendue');
        } finally {
            setIsLoading(false);
        }
    };

    // Mettre à jour une FAQ
    const handleUpdateFaq = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingFaq || !editingFaq.question.trim() || !editingFaq.answer.trim()) {
            toast.error('Question et réponse obligatoires');
            return;
        }

        setIsLoading(true);
        try {
            const { error } = await supabase
                .from('support_faqs')
                .update({
                    question: editingFaq.question.trim(),
                    answer: editingFaq.answer.trim(),
                    category: editingFaq.category,
                    order_index: editingFaq.order_index,
                    is_active: editingFaq.is_active
                })
                .eq('id', editingFaq.id);

            if (error) {
                setError(`Erreur lors de la mise à jour: ${error.message}`);
                toast.error('Erreur lors de la mise à jour de la FAQ');
                return;
            }

            toast.success('✅ FAQ mise à jour avec succès !', {
                description: 'Les modifications ont été enregistrées',
                duration: 3000,
            });

            setEditingFaq(null);
            await fetchFaqs();
        } catch (err) {
            setError(`Erreur inattendue: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
            toast.error('Erreur inattendue');
        } finally {
            setIsLoading(false);
        }
    };

    // Supprimer une FAQ
    const handleDeleteFaq = async (faqId: string) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cette FAQ ?')) {
            return;
        }

        setIsLoading(true);
        try {
            const { error } = await supabase
                .from('support_faqs')
                .delete()
                .eq('id', faqId);

            if (error) {
                setError(`Erreur lors de la suppression: ${error.message}`);
                toast.error('Erreur lors de la suppression de la FAQ');
                return;
            }

            toast.success('🗑️ FAQ supprimée avec succès !', {
                description: 'La FAQ a été définitivement supprimée',
                duration: 3000,
            });

            await fetchFaqs();
        } catch (err) {
            setError(`Erreur inattendue: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
            toast.error('Erreur inattendue');
        } finally {
            setIsLoading(false);
        }
    };

    // Basculer le statut actif/inactif
    const handleToggleActive = async (faq: FAQ) => {
        setIsLoading(true);
        try {
            const { error } = await supabase
                .from('support_faqs')
                .update({ is_active: !faq.is_active })
                .eq('id', faq.id);

            if (error) {
                setError(`Erreur lors du changement de statut: ${error.message}`);
                toast.error('Erreur lors du changement de statut');
                return;
            }

            toast.success(`✅ FAQ ${faq.is_active ? 'désactivée' : 'activée'} !`, {
                description: `La FAQ est maintenant ${faq.is_active ? 'invisible' : 'visible'} pour les utilisateurs`,
                duration: 3000,
            });

            await fetchFaqs();
        } catch (err) {
            setError(`Erreur inattendue: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
            toast.error('Erreur inattendue');
        } finally {
            setIsLoading(false);
        }
    };

    // Afficher les erreurs
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

    return (
        <div className="space-y-4">
            {/* Affichage des erreurs */}
            {renderError()}

            {/* En-tête avec bouton d'ajout */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold">Gestion des FAQ</h2>
                    <p className="text-gray-600">Gérez les questions fréquemment posées</p>
                </div>
                <Button 
                    onClick={() => setShowForm(true)}
                    className="flex items-center gap-2"
                    disabled={isLoading}
                >
                    <Plus className="h-4 w-4" />
                    Nouvelle FAQ
                </Button>
            </div>

            {/* Formulaire de création */}
            {showForm && (
                <Card className="border-blue-200 bg-blue-50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileQuestion className="h-5 w-5" />
                            Nouvelle FAQ
                        </CardTitle>
                        <CardDescription>
                            Créez une nouvelle question fréquemment posée
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleCreateFaq} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium">Question</label>
                                    <Input
                                        value={newFaq.question}
                                        onChange={(e) => setNewFaq({ ...newFaq, question: e.target.value })}
                                        placeholder="Votre question..."
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Catégorie</label>
                                    <select
                                        value={newFaq.category}
                                        onChange={(e) => setNewFaq({ ...newFaq, category: e.target.value })}
                                        className="w-full p-2 border rounded-md"
                                    >
                                        {FAQ_CATEGORIES.map(cat => (
                                            <option key={cat.value} value={cat.value}>
                                                {cat.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium">Réponse</label>
                                <Textarea
                                    value={newFaq.answer}
                                    onChange={(e) => setNewFaq({ ...newFaq, answer: e.target.value })}
                                    placeholder="Votre réponse..."
                                    rows={4}
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium">Ordre d'affichage</label>
                                    <Input
                                        type="number"
                                        value={newFaq.order_index}
                                        onChange={(e) => setNewFaq({ ...newFaq, order_index: parseInt(e.target.value) || 0 })}
                                        min="0"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="new-active"
                                        checked={newFaq.is_active}
                                        onChange={(e) => setNewFaq({ ...newFaq, is_active: e.target.checked })}
                                        className="rounded"
                                    />
                                    <label htmlFor="new-active" className="text-sm font-medium">
                                        FAQ active (visible pour les utilisateurs)
                                    </label>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button type="submit" disabled={isLoading}>
                                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Créer la FAQ'}
                                </Button>
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    onClick={() => setShowForm(false)}
                                    disabled={isLoading}
                                >
                                    <X className="h-4 w-4" />
                                    Annuler
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* Liste des FAQ */}
            <Card>
                <CardHeader>
                    <CardTitle>FAQ existantes ({faqs.length})</CardTitle>
                    <CardDescription>
                        Gérez les questions et réponses disponibles pour les utilisateurs
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center items-center h-32">
                            <div className="flex items-center gap-2">
                                <Loader2 className="h-6 w-6 animate-spin" />
                                <span>Chargement des FAQ...</span>
                            </div>
                        </div>
                    ) : faqs.length === 0 ? (
                        <div className="text-center text-gray-500 py-8">
                            <FileQuestion className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                            <p>Aucune FAQ trouvée</p>
                            <p className="text-sm mt-2">Créez votre première FAQ pour aider les utilisateurs.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {faqs.map((faq) => (
                                <div key={faq.id} className="border rounded-lg p-4">
                                    {editingFaq?.id === faq.id ? (
                                        // Mode édition
                                        <form onSubmit={handleUpdateFaq} className="space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-sm font-medium">Question</label>
                                                    <Input
                                                        value={editingFaq.question}
                                                        onChange={(e) => setEditingFaq({ ...editingFaq, question: e.target.value })}
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-sm font-medium">Catégorie</label>
                                                    <select
                                                        value={editingFaq.category}
                                                        onChange={(e) => setEditingFaq({ ...editingFaq, category: e.target.value })}
                                                        className="w-full p-2 border rounded-md"
                                                    >
                                                        {FAQ_CATEGORIES.map(cat => (
                                                            <option key={cat.value} value={cat.value}>
                                                                {cat.label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium">Réponse</label>
                                                <Textarea
                                                    value={editingFaq.answer}
                                                    onChange={(e) => setEditingFaq({ ...editingFaq, answer: e.target.value })}
                                                    rows={4}
                                                    required
                                                />
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-sm font-medium">Ordre d'affichage</label>
                                                    <Input
                                                        type="number"
                                                        value={editingFaq.order_index}
                                                        onChange={(e) => setEditingFaq({ ...editingFaq, order_index: parseInt(e.target.value) || 0 })}
                                                        min="0"
                                                    />
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="checkbox"
                                                        id={`active-${faq.id}`}
                                                        checked={editingFaq.is_active}
                                                        onChange={(e) => setEditingFaq({ ...editingFaq, is_active: e.target.checked })}
                                                        className="rounded"
                                                    />
                                                    <label htmlFor={`active-${faq.id}`} className="text-sm font-medium">
                                                        FAQ active
                                                    </label>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button type="submit" disabled={isLoading}>
                                                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                                    Sauvegarder
                                                </Button>
                                                <Button 
                                                    type="button" 
                                                    variant="outline" 
                                                    onClick={() => setEditingFaq(null)}
                                                    disabled={isLoading}
                                                >
                                                    <X className="h-4 w-4" />
                                                    Annuler
                                                </Button>
                                            </div>
                                        </form>
                                    ) : (
                                        // Mode affichage
                                        <div>
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex-1">
                                                    <h3 className="font-semibold text-lg">{faq.question}</h3>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className={`text-xs px-2 py-1 rounded-full ${
                                                            faq.is_active 
                                                                ? 'bg-green-100 text-green-800' 
                                                                : 'bg-gray-100 text-gray-800'
                                                        }`}>
                                                            {faq.is_active ? 'Active' : 'Inactive'}
                                                        </span>
                                                        <span className="text-xs text-gray-500">
                                                            {FAQ_CATEGORIES.find(cat => cat.value === faq.category)?.label || faq.category}
                                                        </span>
                                                        <span className="text-xs text-gray-500">
                                                            Ordre: {faq.order_index}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => setEditingFaq(faq)}
                                                        disabled={isLoading}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleToggleActive(faq)}
                                                        disabled={isLoading}
                                                    >
                                                        {faq.is_active ? 'Désactiver' : 'Activer'}
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        onClick={() => handleDeleteFaq(faq.id)}
                                                        disabled={isLoading}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                            <div className="bg-gray-50 rounded p-3">
                                                <p className="whitespace-pre-wrap text-gray-700">{faq.answer}</p>
                                            </div>
                                            <div className="text-xs text-gray-500 mt-2">
                                                Créée le {new Date(faq.created_at).toLocaleDateString('fr-FR')}
                                                {faq.updated_at !== faq.created_at && 
                                                    ` • Modifiée le ${new Date(faq.updated_at).toLocaleDateString('fr-FR')}`
                                                }
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}; 