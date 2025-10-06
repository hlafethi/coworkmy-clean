import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, User, Building2, MapPin, Camera } from "lucide-react";
import { useAuth } from "@/context/AuthContextPostgreSQL";
import { AvatarUploadSimple } from "@/components/profile/AvatarUploadSimple";
import { LogoUploadSimple } from "@/components/profile/LogoUploadSimple";
import { logger } from '@/utils/logger';

const EditProfile = () => {
  const navigate = useNavigate();
  const { user, profile: authProfile, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    phone_number: "",
    company: "",
    company_name: "",
    city: "",
    address: "",
    address_street: "",
    address_city: "",
    address_postal_code: "",
    address_country: "",
    birth_date: "",
    presentation: "",
    profile_picture: "",
    logo_url: "",
    avatar_url: ""
  });

  useEffect(() => {
    if (typeof user === 'undefined') {
      return;
    }
    
    if (user === null) {
      toast.error("Vous devez être connecté pour accéder à cette page");
      navigate("/auth/login");
      return;
    }

    if (authProfile) {
      setFormData({
        first_name: authProfile.first_name || "",
        last_name: authProfile.last_name || "",
        email: authProfile.email || "",
        phone: authProfile.phone || "",
        phone_number: authProfile.phone_number || "",
        company: authProfile.company || "",
        company_name: authProfile.company_name || "",
        city: authProfile.city || "",
        address: authProfile.address || "",
        address_street: authProfile.address_street || "",
        address_city: authProfile.address_city || "",
        address_postal_code: authProfile.address_postal_code || "",
        address_country: authProfile.address_country || "",
        birth_date: authProfile.birth_date ? authProfile.birth_date.split('T')[0] : "",
        presentation: authProfile.presentation || "",
        profile_picture: authProfile.profile_picture || "",
        logo_url: authProfile.logo_url || "",
        avatar_url: authProfile.avatar_url || ""
      });
      setLoading(false);
    } else {
      toast.error("Erreur lors du chargement du profil");
      setLoading(false);
    }
  }, [navigate, user, authProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (!user) {
        toast.error("Vous devez être connecté pour modifier votre profil");
        return;
      }

      const updateData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone,
        phone_number: formData.phone_number,
        company: formData.company,
        company_name: formData.company_name,
        city: formData.city,
        address: formData.address,
        address_street: formData.address_street,
        address_city: formData.address_city,
        address_postal_code: formData.address_postal_code,
        address_country: formData.address_country,
        birth_date: formData.birth_date || null,
        presentation: formData.presentation,
        profile_picture: formData.profile_picture,
        logo_url: formData.logo_url,
        avatar_url: formData.avatar_url
      };

      const result = await apiClient.put(`/users/${user.id}`, updateData);

      if (!result.success) {
        if (result.error === 'Token invalide' || result.error === 'Accès non autorisé') {
          toast.error("Session expirée. Veuillez vous reconnecter.");
          navigate("/auth/login");
          return;
        }
        toast.error(`Erreur lors de la mise à jour du profil: ${result.error}`);
        return;
      }

      toast.success("Profil mis à jour avec succès");
      navigate("/profile");
    } catch (error) {
      logger.error("Error updating profile:", error);
      toast.error("Erreur lors de la mise à jour du profil");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAvatarUpdated = async (newAvatarUrl: string) => {
    setFormData(prev => ({
      ...prev,
      avatar_url: newAvatarUrl
    }));
  };

  const handleLogoUpdated = async (newLogoUrl: string) => {
    setFormData(prev => ({
      ...prev,
      logo_url: newLogoUrl
    }));
  };

  if ((authLoading && !authProfile) || (loading && !formData.first_name) || typeof user === 'undefined') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/profile")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour au profil
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Chargement...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Menu de navigation */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/profile")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour au profil
            </Button>
            <h1 className="text-2xl font-bold">Modifier le profil</h1>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate("/profile")}
          >
            Annuler
          </Button>
        </div>
      </div>
      
      <div className="space-y-6">
        {/* Photos et logos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Photo de profil */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Photo de profil
              </CardTitle>
            </CardHeader>
            <CardContent>
              {user && (
                <AvatarUploadSimple
                  currentAvatarUrl={formData.avatar_url}
                  userId={user.id}
                  onAvatarUpdated={handleAvatarUpdated}
                />
              )}
            </CardContent>
          </Card>

          {/* Logo d'entreprise */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Logo d'entreprise
              </CardTitle>
            </CardHeader>
            <CardContent>
              {user && (
                <LogoUploadSimple
                  currentLogoUrl={formData.logo_url}
                  userId={user.id}
                  onLogoUpdated={handleLogoUpdated}
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Informations personnelles */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informations personnelles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">Prénom</Label>
                  <Input
                    id="first_name"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Nom</Label>
                  <Input
                    id="last_name"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="birth_date">Date de naissance</Label>
                  <Input
                    id="birth_date"
                    name="birth_date"
                    type="date"
                    value={formData.birth_date}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone_number">Numéro de téléphone</Label>
                  <Input
                    id="phone_number"
                    name="phone_number"
                    value={formData.phone_number}
                    onChange={handleChange}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="presentation">Présentation</Label>
                <Textarea
                  id="presentation"
                  name="presentation"
                  value={formData.presentation}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Parlez-nous de vous..."
                />
              </div>
              
              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/profile")}
                >
                  Annuler
                </Button>
                <Button 
                  type="submit"
                  disabled={saving}
                >
                  {saving ? "Enregistrement..." : "Enregistrer"}
                </Button>
              </div>
            </form>
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
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company">Entreprise</Label>
                <Input
                  id="company"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company_name">Nom de l'entreprise</Label>
                <Input
                  id="company_name"
                  name="company_name"
                  value={formData.company_name}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">Ville</Label>
                <Input
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Adresse */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Adresse
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="address">Adresse complète</Label>
                <Input
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address_street">Rue</Label>
                <Input
                  id="address_street"
                  name="address_street"
                  value={formData.address_street}
                  onChange={handleChange}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="address_city">Ville</Label>
                  <Input
                    id="address_city"
                    name="address_city"
                    value={formData.address_city}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address_postal_code">Code postal</Label>
                  <Input
                    id="address_postal_code"
                    name="address_postal_code"
                    value={formData.address_postal_code}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address_country">Pays</Label>
                  <Input
                    id="address_country"
                    name="address_country"
                    value={formData.address_country}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
};

export default EditProfile;
