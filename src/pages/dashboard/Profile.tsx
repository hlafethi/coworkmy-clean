import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContextNew";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import Navbar from "@/components/common/Navbar";
import Footer from "@/components/common/Footer";
import DocumentsSection from "@/pages/profile/DocumentsSection";
import AvatarUpload from "@/components/profile/AvatarUpload";
import LogoUpload from "@/components/profile/LogoUpload";
import { Edit, Building2, User, MapPin, FileText } from "lucide-react";
import { StripeCustomerPortal } from "@/components/common/StripeCustomerPortal";

const Profile = () => {
    const { user, profile: authProfile, loading: authLoading, profileLoaded, updateProfile } = useAuth();
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<any>(null);
    const navigate = useNavigate();

    const handleAvatarUpdated = async (newAvatarUrl: string) => {
        // Mise à jour immédiate du profil local
        setProfile(prev => ({
            ...prev,
            avatar_url: newAvatarUrl
        }));
        
        // Mise à jour du contexte d'authentification
        updateProfile({ avatar_url: newAvatarUrl });
        
        // Mise à jour en arrière-plan sans bloquer l'interface
        if (user) {
            try {
                await supabase
                    .from('profiles')
                    .update({ 
                        avatar_url: newAvatarUrl,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', user.id);
            } catch (error) {
                console.error('Erreur lors de la mise à jour du profil:', error);
            }
        }
    };

    const handleLogoUpdated = async (newLogoUrl: string) => {
        // Mise à jour immédiate du profil local
        setProfile(prev => ({
            ...prev,
            logo_url: newLogoUrl
        }));
        
        // Mise à jour du contexte d'authentification
        updateProfile({ logo_url: newLogoUrl });
        
        // Mise à jour en arrière-plan sans bloquer l'interface
        if (user) {
            try {
                await supabase
                    .from('profiles')
                    .update({ 
                        logo_url: newLogoUrl,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', user.id);
            } catch (error) {
                console.error('Erreur lors de la mise à jour du profil:', error);
            }
        }
    };

    useEffect(() => {
        console.log('🔍 Profile useEffect', { 
            userId: user?.id, 
            hasAuthProfile: !!authProfile, 
            authLoading, 
            profileLoaded 
        });
        
        // Attendre que l'authentification soit terminée
        if (typeof user === 'undefined' || authLoading) {
            console.log('⏳ En attente de l\'authentification');
            return;
        }
        
        // Si pas d'utilisateur, rediriger
        if (user === null) {
            console.log('❌ Utilisateur non connecté - redirection');
            navigate("/auth/login");
            return;
        }

        // Si le profil n'est pas encore chargé, attendre
        if (!profileLoaded) {
            console.log('⏳ Profil pas encore chargé');
            return;
        }

        // Utilisateur connecté, utiliser le profil du contexte d'authentification
        if (authProfile) {
            console.log('✅ Utilisation du profil du contexte');
            setProfile(authProfile);
            setLoading(false);
        } else {
            console.log('❌ Pas de profil dans le contexte - erreur');
            toast.error("Erreur lors du chargement du profil");
            setLoading(false);
        }
    }, [navigate, user, authProfile, authLoading, profileLoaded]);

    console.log('PROFILE render', { profile, loading, user, profileLoaded });

    if (authLoading || !profileLoaded || (loading && !profile)) {
        console.log('⏳ Affichage du spinner de chargement');
        return (
            <div className="min-h-screen flex flex-col">
                <Navbar />
                <main className="flex-grow flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-grow py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-6xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Colonne gauche : avatar, logo, infos principales, bouton édition */}
                        <div className="flex flex-col items-center md:items-start space-y-6 md:col-span-1">
                            {/* Avatar */}
                            {user && (
                                <AvatarUpload
                                    currentAvatarUrl={profile?.avatar_url}
                                    userId={user.id}
                                    onAvatarUpdated={handleAvatarUpdated}
                                />
                            )}
                            {/* Logo entreprise */}
                            {user && (
                                <LogoUpload
                                    currentLogoUrl={profile?.logo_url}
                                    userId={user.id}
                                    onLogoUpdated={handleLogoUpdated}
                                />
                            )}
                            {/* Infos principales */}
                            <div className="w-full text-center md:text-left">
                                <h1 className="text-2xl font-bold text-gray-900">
                                    {profile?.first_name && profile?.last_name 
                                        ? `${profile.first_name} ${profile.last_name}`
                                        : 'Mon Profil'}
                                </h1>
                                <p className="text-gray-600 mt-1">
                                    {profile?.email || user?.email}
                                </p>
                                {profile?.company && (
                                    <p className="text-sm text-gray-500 mt-1">
                                        {profile.company}
                                    </p>
                                )}
                            </div>
                            {/* Bouton édition */}
                            <Button 
                                onClick={() => navigate("/profile/edit")}
                                className="flex items-center gap-2 self-center md:self-start"
                            >
                                <Edit className="h-4 w-4" />
                                Modifier le profil
                            </Button>
                        </div>
                        {/* Colonne droite : infos complémentaires, documents, etc. */}
                        <div className="md:col-span-2 space-y-6">
                            {/* Informations personnelles */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <User className="h-5 w-5" />
                                        Informations personnelles
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-sm font-medium text-gray-500">Prénom</Label>
                                        <p className="mt-1 text-sm text-gray-900">{profile?.first_name || "Non renseigné"}</p>
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium text-gray-500">Nom</Label>
                                        <p className="mt-1 text-sm text-gray-900">{profile?.last_name || "Non renseigné"}</p>
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium text-gray-500">Email</Label>
                                        <p className="mt-1 text-sm text-gray-900">{profile?.email || user?.email || "Non renseigné"}</p>
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium text-gray-500">Date de naissance</Label>
                                        <p className="mt-1 text-sm text-gray-900">
                                            {profile?.birth_date ? new Date(profile.birth_date).toLocaleDateString('fr-FR') : "Non renseigné"}
                                        </p>
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium text-gray-500">Téléphone</Label>
                                        <p className="mt-1 text-sm text-gray-900">{profile?.phone || "Non renseigné"}</p>
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium text-gray-500">Numéro de téléphone</Label>
                                        <p className="mt-1 text-sm text-gray-900">{profile?.phone_number || "Non renseigné"}</p>
                                    </div>
                                    {profile?.presentation && (
                                        <div className="md:col-span-2">
                                            <Label className="text-sm font-medium text-gray-500">Présentation</Label>
                                            <p className="mt-1 text-sm text-gray-900">{profile.presentation}</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                            {/* Informations professionnelles */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Building2 className="h-5 w-5" />
                                        Informations professionnelles
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-sm font-medium text-gray-500">Entreprise</Label>
                                        <p className="mt-1 text-sm text-gray-900">{profile?.company || "Non renseigné"}</p>
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium text-gray-500">Nom de l'entreprise</Label>
                                        <p className="mt-1 text-sm text-gray-900">{profile?.company_name || "Non renseigné"}</p>
                                    </div>
                                </CardContent>
                            </Card>
                            {/* Documents */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <FileText className="h-5 w-5" />
                                        Documents
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <DocumentsSection userId={user?.id} />
                                </CardContent>
                            </Card>
                            {/* Portail client Stripe */}
                            <StripeCustomerPortal />
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default Profile; 