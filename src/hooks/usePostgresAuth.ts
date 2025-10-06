// @ts-nocheck
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { UserService } from "@/integrations/postgres/services";
import { User } from "@/integrations/postgres/types";
import { toast } from "sonner";
import { logger } from '@/utils/logger';

// Clé pour stocker l'email de l'utilisateur dans le localStorage
const USER_EMAIL_KEY = 'coworkmy-user-email';

/**
 * Hook pour gérer l'authentification avec PostgreSQL
 */
export function usePostgresAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  /**
   * Récupérer l'utilisateur à partir de l'email stocké dans le localStorage
   */
  const fetchUser = async () => {
    try {
      setLoading(true);
      
      // Récupérer l'email de l'utilisateur depuis le localStorage
      const email = localStorage.getItem(USER_EMAIL_KEY);
      if (!email) {
        setUser(null);
        setLoading(false);
        return;
      }
      
      // Récupérer l'utilisateur à partir de l'email
      const user = await UserService.getByEmail(email);
      setUser(user);
    } catch (error) {
      logger.error("Erreur lors de la récupération de l'utilisateur:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Connecter un utilisateur avec son email et son mot de passe
   * @param email Email de l'utilisateur
   * @param password Mot de passe de l'utilisateur
   * @returns L'utilisateur connecté
   */
  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      
      // Récupérer l'utilisateur à partir de l'email
      const user = await UserService.getByEmail(email);
      if (!user) {
        throw new Error("Utilisateur non trouvé");
      }
      
      // TODO: Vérifier le mot de passe
      // Pour l'instant, on considère que l'authentification est réussie
      // Dans une implémentation réelle, il faudrait vérifier le mot de passe
      
      // Stocker l'email de l'utilisateur dans le localStorage
      localStorage.setItem(USER_EMAIL_KEY, email);
      
      setUser(user);
      toast.success("Connexion réussie");
      
      return user;
    } catch (error) {
      logger.error("Erreur lors de la connexion:", error);
      toast.error("Erreur lors de la connexion");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Déconnecter l'utilisateur
   */
  const signOut = async () => {
    try {
      // Supprimer l'email de l'utilisateur du localStorage
      localStorage.removeItem(USER_EMAIL_KEY);
      
      setUser(null);
      toast.success("Déconnexion réussie");
      navigate('/auth/login');
    } catch (error) {
      logger.error("Erreur lors de la déconnexion:", error);
      toast.error("Erreur lors de la déconnexion");
    }
  };

  /**
   * Créer un nouvel utilisateur
   * @param email Email de l'utilisateur
   * @param password Mot de passe de l'utilisateur
   * @param firstName Prénom de l'utilisateur
   * @param lastName Nom de l'utilisateur
   * @returns L'utilisateur créé
   */
  const signUp = async (email: string, password: string, firstName?: string, lastName?: string) => {
    try {
      setLoading(true);
      
      // Vérifier si l'utilisateur existe déjà
      const existingUser = await UserService.getByEmail(email);
      if (existingUser) {
        throw new Error("Un utilisateur avec cet email existe déjà");
      }
      
      // Créer un nouvel utilisateur
      const newUser = await UserService.create({
        email,
        first_name: firstName || null,
        last_name: lastName || null,
        is_admin: false
      });
      
      // TODO: Stocker le mot de passe de manière sécurisée
      // Dans une implémentation réelle, il faudrait hasher le mot de passe
      
      // Stocker l'email de l'utilisateur dans le localStorage
      localStorage.setItem(USER_EMAIL_KEY, email);
      
      setUser(newUser);
      toast.success("Inscription réussie");
      
      return newUser;
    } catch (error) {
      logger.error("Erreur lors de l'inscription:", error);
      toast.error("Erreur lors de l'inscription");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Récupérer l'utilisateur au chargement du composant
  useEffect(() => {
    fetchUser();
  }, []);

  return {
    user,
    isAdmin: user?.is_admin || false,
    loading,
    signIn,
    signOut,
    signUp
  };
}
