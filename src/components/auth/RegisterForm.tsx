import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContextPostgreSQL";
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
  const { signUp } = useAuth();

  const form = useForm<RegisterFormValues>({
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      fullName: "",
    },
  });

  const validatePasswordStrength = (password: string): boolean => {
    const hasLowerCase = /[a-z]/.test(password);
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasMinLength = password.length >= 8;
    return hasLowerCase && hasUpperCase && hasNumbers && hasMinLength;
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
      const result = await signUp(
        values.email,
        values.password,
        values.fullName || values.email.split('@')[0]
      );
      
      if (result.user && !result.error) {
        toast.success("Compte créé avec succès ! Vous pouvez maintenant vous connecter.");
        navigate('/auth/login');
      } else {
        if (result.error?.includes('already') || result.error?.includes('registered')) {
          toast.error("Cette adresse email est déjà utilisée.");
        } else if (result.error?.includes('Invalid email')) {
          toast.error("Adresse email invalide.");
        } else {
          toast.error(result.error || "Erreur lors de la création du compte.");
        }
      }
    } catch (error) {
      console.error("Erreur d'inscription:", error);
      toast.error("Erreur lors de la création du compte.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold">Créer un compte</h1>
        <p className="text-muted-foreground mt-2">
          Rejoignez CoworkMy pour commencer
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nom complet (optionnel)</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Votre nom complet"
                    disabled={isLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            rules={{
              required: "L'email est requis",
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: "Adresse email invalide",
              },
            }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="email"
                    placeholder="votre@email.com"
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
              required: "Le mot de passe est requis",
              minLength: {
                value: 8,
                message: "Le mot de passe doit contenir au moins 8 caractères",
              },
            }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mot de passe</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="password"
                    placeholder="••••••••"
                    disabled={isLoading}
                  />
                </FormControl>
                <div className="text-sm text-muted-foreground">
                  {getPasswordStrengthMessage(field.value)}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            rules={{
              required: "Confirmez votre mot de passe",
              validate: (value) =>
                value === form.getValues("password") ||
                "Les mots de passe ne correspondent pas",
            }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirmer le mot de passe</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="password"
                    placeholder="••••••••"
                    disabled={isLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? "Création du compte..." : "Créer un compte"}
          </Button>
        </form>
      </Form>

      <div className="mt-6 text-center">
        <p className="text-sm text-muted-foreground">
          Vous avez déjà un compte ?{" "}
          <Link to="/auth/login" className="text-primary hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}