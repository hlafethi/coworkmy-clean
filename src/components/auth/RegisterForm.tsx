import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2 } from "lucide-react";

interface RegisterFormValues {
  email: string;
  password: string;
  confirmPassword: string;
  fullName?: string;
}

export default function RegisterForm() {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const form = useForm<RegisterFormValues>({
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      fullName: "",
    },
  });

  const currentPassword = form.watch("password");

  // Validation de mot de passe simple
  const validatePasswordStrength = (password: string): boolean => {
    if (password.length < 8) return false;
    const hasLowerCase = /[a-z]/.test(password);
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumbers = /\d/.test(password);
    return hasLowerCase && hasUpperCase && hasNumbers;
  };

  const getPasswordStrengthMessage = (password: string): string => {
    if (password.length === 0) return "";
    if (password.length < 8) return "Trop court (minimum 8 caractères)";
    const criteria = [];
    if (!/[a-z]/.test(password)) criteria.push("minuscule");
    if (!/[A-Z]/.test(password)) criteria.push("majuscule");
    if (!/\d/.test(password)) criteria.push("chiffre");
    if (criteria.length > 0) {
      return `Manque : ${criteria.join(", ")}`;
    }
    return "Mot de passe fort ✓";
  };

  const onSubmit = async (values: RegisterFormValues) => {
    if (!validatePasswordStrength(values.password)) {
      toast.error("Le mot de passe doit contenir au moins 8 caractères avec des majuscules, minuscules et chiffres.");
      return;
    }
    if (values.password !== values.confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas.");
      return;
    }
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            full_name: values.fullName || values.email.split('@')[0]
          }
        }
      });
      if (error) {
        if (
          error.message.includes('already') ||
          error.message.includes('registered')
        ) {
          toast.error("Cette adresse email est déjà utilisée ou en attente de confirmation.");
          return;
        }
        if (error.message.includes('Password should be at least')) {
          toast.error("Le mot de passe doit contenir au moins 6 caractères.");
          return;
        }
        if (error.message.includes('Invalid email')) {
          toast.error("Adresse email invalide.");
          return;
        }
        if (error.message.includes('Signup is disabled')) {
          toast.error("Les inscriptions sont temporairement désactivées.");
          return;
        }
        if (error.message.includes('Email rate limit exceeded')) {
          toast.error("Trop de tentatives. Veuillez attendre avant de réessayer.");
          return;
        }
        toast.error(`Erreur lors de l'inscription: ${error.message}`);
        return;
      }
      if (data.user && !data.session) {
        toast.success(
          "Inscription réussie ! Vérifiez votre email pour confirmer votre compte avant de vous connecter.",
          { duration: 8000 }
        );
        navigate('/auth/login', {
          state: {
            message: "Vérifiez votre email pour confirmer votre compte.",
            email: values.email
          }
        });
      } else if (data.session) {
        toast.success("Inscription réussie ! Vous êtes maintenant connecté.");
        navigate('/dashboard');
      } else {
        toast.success("Inscription réussie !");
        navigate('/auth/login');
      }
    } catch (error) {
      console.error('❌ Erreur complète inscription:', error);
      toast.error("Une erreur inattendue s'est produite. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 w-full max-w-md mx-auto p-6">
        <FormField
          control={form.control}
          name="email"
          rules={{
            required: "Email requis",
            pattern: {
              value: /^[^@\s]+@[^@\s]+\.[^@\s]+$/,
              message: "Adresse email invalide"
            }
          }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="email@example.com"
                  {...field}
                  disabled={isLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          rules={{
            required: "Mot de passe requis",
            minLength: {
              value: 8,
              message: "Le mot de passe doit contenir au moins 8 caractères"
            }
          }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mot de passe</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="Mot de passe sécurisé"
                  {...field}
                  disabled={isLoading}
                />
              </FormControl>
              {currentPassword && (
                <p className={`text-xs mt-1 ${validatePasswordStrength(currentPassword)
                    ? "text-green-600"
                    : "text-orange-600"
                  }`}>
                  {getPasswordStrengthMessage(currentPassword)}
                </p>
              )}
              {!currentPassword && (
                <p className="text-xs text-gray-500 mt-1">
                  Utilisez au moins 8 caractères avec majuscules, minuscules et chiffres
                </p>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirmPassword"
          rules={{
            required: "Confirmation requise",
            validate: (value) =>
              value === form.getValues().password || "Les mots de passe ne correspondent pas"
          }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirmer le mot de passe</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="Confirmer le mot de passe"
                  {...field}
                  disabled={isLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Inscription en cours...
            </>
          ) : (
            "S'inscrire"
          )}
        </Button>
        <p className="text-center text-sm text-gray-600">
          Déjà un compte ?{" "}
          <Link to="/auth/login" className="text-primary hover:underline">
            Se connecter
          </Link>
        </p>
      </form>
    </Form>
  );
}
