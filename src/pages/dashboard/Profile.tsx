import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContextPostgreSQL";
import { apiClient } from "@/lib/api-client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import Navbar from "@/components/common/Navbar";
import Footer from "@/components/common/Footer";
import DocumentsSection from "@/pages/profile/DocumentsSection";
import { AvatarUploadSimple } from "@/components/profile/AvatarUploadSimple";
import { LogoUploadSimple } from "@/components/profile/LogoUploadSimple";
import { Edit, Building2, User, FileText } from "lucide-react";
import { StripeCustomerPortal } from "@/components/common/StripeCustomerPortal";
// Logger supprimé - utilisation de console directement
const Profile = () => {
    const { user, profile: authProfile, loading: authLoading, profileLoaded } = useAuth();
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<any>(null);
    const [refreshKey, setRefreshKey] = useState(0);
    const [forceRender, setForceRender] = useState(0);
    const navigate = useNavigate();

    const handleAvatarUpdated = async (newAvatarUrl: string) => {
        // Mise à jour immédiate du profil local
        setProfile((prev: any) => ({
            ...prev,
            avatar_url: newAvatarUrl
        }));
        
        // Mise à jour du contexte d'authentification
        // updateProfile({ avatar_url: newAvatarUrl });
        
        // Mise à jour en arrière-plan sans bloquer l'interface
        if (user) {
            try {
                await apiClient.put(`/users/${user.id}`, { 
                    avatar_url: newAvatarUrl,
                    updated_at: new Date().toISOString()
                });
            } catch (error) {
                console.error('Erreur lors de la mise à jour du profil:', error);
            }
        }
    };

    const handleLogoUpdated = async (newLogoUrl: string) => {
        // Mise à jour immédiate du profil local
        setProfile((prev: any) => ({
            ...prev,
            logo_url: newLogoUrl
        }));
        
        // Mise à jour du contexte d'authentification
        // updateProfile({ logo_url: newLogoUrl });
        
        // Mise à jour en arrière-plan sans bloquer l'interface
        if (user) {
            try {
                await apiClient.put(`/users/${user.id}`, { 
                    logo_url: newLogoUrl,
                    updated_at: new Date().toISOString()
                });
            } catch (error) {
                console.error('Erreur lors de la mise à jour du profil:', error);
            }
        }
    };

    useEffect(() => {
        
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

        // Charger le profil directement depuis l'API
  const loadProfile = async () => {
    try {
      const result = await apiClient.get(`/users/${user.id}`);
      
      if (result.success && result.data) {
        setProfile(result.data);
        setForceRender(prev => prev + 1);
      } else {
        toast.error("Erreur lors du chargement du profil");
      }
    } catch (error) {
      console.error('Erreur lors du chargement du profil:', error);
      toast.error("Erreur lors du chargement du profil");
    } finally {
      setLoading(false);
    }
  };

        loadProfile();
    }, [navigate, user, authLoading, refreshKey]);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    setForceRender(prev => prev + 1);
  };

    if (authLoading || !profileLoaded || (loading && !profile)) {
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
            <main className="flex-grow py-6 px-2 sm:px-4 lg:px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Colonne gauche : images et infos principales */}
                        <div className="space-y-6">
                            {/* Avatar avec infos */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <User className="h-5 w-5" />
                                        Photo de profil
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="text-center">
                                    {user && (
                                        <div className="flex justify-center mb-4">
                                            <AvatarUploadSimple
                                                currentAvatarUrl={profile?.avatar_url}
                                                userId={user.id}
                                                onAvatarUpdated={handleAvatarUpdated}
                                            />
                                        </div>
                                    )}
                                    <h1 className="text-xl font-bold text-gray-900 mb-1">
                                        {profile?.first_name && profile?.last_name 
                                            ? `${profile.first_name} ${profile.last_name}`
                                            : 'Mon Profil'}
                                    </h1>
                                    <p className="text-gray-600 text-sm mb-4">
                                        {profile?.email || user?.email}
                                    </p>
                                </CardContent>
                            </Card>

                            {/* Logo entreprise */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Building2 className="h-5 w-5" />
                                        Logo entreprise
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="text-center">
                                    {user && (
                                        <div className="flex justify-center mb-4">
                                            <LogoUploadSimple
                                                currentLogoUrl={profile?.logo_url}
                                                userId={user.id}
                                                onLogoUpdated={handleLogoUpdated}
                                            />
                                        </div>
                                    )}
                                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                        {profile?.company || "Aucune entreprise"}
                                    </h3>
                                    <p className="text-gray-500 text-sm">
                                        {profile?.company_name || ""}
                                    </p>
                                </CardContent>
                            </Card>

                            {/* Bouton d'action */}
                            <Card>
                                <CardContent className="pt-6">
                                    <Button 
                                        onClick={() => navigate("/profile/edit")}
                                        className="w-full"
                                    >
                                        <Edit className="h-4 w-4 mr-2" />
                                        Modifier le profil
                                    </Button>
                                </CardContent>
                            </Card>

                            {/* Gestion des paiements */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Building2 className="h-5 w-5" />
                                        Gestion des paiements
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <StripeCustomerPortal />
                                </CardContent>
                            </Card>
                        </div>

                        {/* Colonne 2 : informations personnelles, professionnelles et adresse */}
                        <div className="space-y-6">
                            {/* Informations personnelles */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <User className="h-5 w-5" />
                                        Informations personnelles
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4" key={`profile-content-${forceRender}`}>
                                    <div key={`firstname-${forceRender}`}>
                                        <Label className="text-sm font-medium text-gray-500">Prénom</Label>
                                        <p className="mt-1 text-sm text-gray-900">
                                            {profile?.first_name || "Non renseigné"}
                                        </p>
                                    </div>
                                    <div key={`lastname-${forceRender}`}>
                                        <Label className="text-sm font-medium text-gray-500">Nom</Label>
                                        <p className="mt-1 text-sm text-gray-900">
                                            {profile?.last_name || "Non renseigné"}
                                        </p>
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
                                    <div key={`phone-${forceRender}`}>
                                        <Label className="text-sm font-medium text-gray-500">Téléphone</Label>
                                        <p className="mt-1 text-sm text-gray-900">
                                            {profile?.phone || "Non renseigné"}
                                        </p>
                                    </div>
                                    {profile?.presentation && (
                                        <div>
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
                                <CardContent className="space-y-4">
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

                            {/* Adresse */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Building2 className="h-5 w-5" />
                                        Adresse
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <Label className="text-sm font-medium text-gray-500">Ville</Label>
                                        <p className="mt-1 text-sm text-gray-900">{profile?.city || "Non renseigné"}</p>
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium text-gray-500">Adresse</Label>
                                        <p className="mt-1 text-sm text-gray-900">{profile?.address || "Non renseigné"}</p>
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium text-gray-500">Code postal</Label>
                                        <p className="mt-1 text-sm text-gray-900">{profile?.address_postal_code || "Non renseigné"}</p>
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium text-gray-500">Pays</Label>
                                        <p className="mt-1 text-sm text-gray-900">{profile?.address_country || "Non renseigné"}</p>
                                    </div>
                                </CardContent>
                            </Card>

                        </div>

                        {/* Colonne 3 : Documents */}
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <FileText className="h-5 w-5" />
                                        Documents
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <DocumentsSection userId={user?.id || ''} />
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default Profile; 