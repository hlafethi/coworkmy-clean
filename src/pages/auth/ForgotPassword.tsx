import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import Navbar from "@/components/common/Navbar";
import Footer from "@/components/common/Footer";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      console.log('🔄 Envoi de l\'email de réinitialisation...');
      console.log('📧 Email:', email);

      const redirectUrl = `${window.location.origin}/auth/reset-password`;
      console.log('🔗 URL de redirection:', redirectUrl);

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) {
        console.error('❌ Erreur:', error);
        if (error.message?.includes('rate limit')) {
          setError("Trop de tentatives. Veuillez attendre quelques minutes avant de réessayer.");
        } else if (error.message?.includes('invalid email')) {
          setError("Adresse email invalide.");
        } else {
          throw error;
        }
        return;
      }

      console.log('✅ Email envoyé avec succès');
      toast.success("Un email de réinitialisation a été envoyé à votre adresse email.");
      setSuccess(true);
    } catch (error: any) {
      console.error('❌ Erreur complète:', error);
      setError(`Erreur: ${error.message || 'Impossible d\'envoyer l\'email de réinitialisation'}`);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-green-600">Email envoyé !</CardTitle>
            <CardDescription>
              Un email de réinitialisation a été envoyé à votre adresse email.
              Vérifiez votre boîte de réception pour réinitialiser votre mot de passe.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => navigate('/auth/login')}
              className="w-full"
            >
              Retour à la connexion
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-gray-800">
              Réinitialiser votre mot de passe
            </CardTitle>
            <CardDescription>
              Entrez votre adresse email pour recevoir un lien de réinitialisation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Adresse email
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="votre@email.com"
                  autoComplete="email"
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Envoi...
                  </>
                ) : (
                  'Envoyer le lien de réinitialisation'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default ForgotPassword;
