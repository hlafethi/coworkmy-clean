import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!email.trim() || !password) {
        throw new Error('Veuillez remplir tous les champs');
      }

      logger.log('[LoginForm] Tentative de connexion...');

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim()
      });

      if (error) {
        if (error.message.includes('Email not confirmed')) {
          throw new Error('Vérifiez votre email pour confirmer le compte');
        }
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('Email ou mot de passe incorrect');
        }
        if (error.message.includes('rate limit')) {
          throw new Error('Trop de tentatives. Veuillez réessayer plus tard');
        }
        throw new Error('Erreur de connexion: ' + error.message);
      }

      if (data?.user) {
        logger.log('[LoginForm] Connexion réussie, vérification du profil...');
        logger.log('[LoginForm] User ID:', data.user.id);
        logger.log('[LoginForm] User email:', data.user.email);
        toast.success('Connexion réussie');
        
        // Vérifier le profil utilisateur avec la même logique que useAuth
        try {
          // Essayer d'abord avec user_id
          let { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('is_admin, first_name, last_name, id, user_id, email')
            .eq('user_id', data.user.id)
            .single();

          // Si pas trouvé avec user_id, essayer avec id
          if (profileError && profileError.code === 'PGRST116') {
            logger.log('[LoginForm] Profile not found with user_id, trying with id...');
            const { data: profileById, error: errorById } = await supabase
              .from('profiles')
              .select('is_admin, first_name, last_name, id, user_id, email')
              .eq('id', data.user.id)
              .single();
            
            if (!errorById) {
              profile = profileById;
              profileError = null;
            } else {
              profileError = errorById;
            }
          }

          // Si toujours pas trouvé, essayer avec email
          if (profileError && profileError.code === 'PGRST116') {
            logger.log('[LoginForm] Profile not found with id, trying with email...');
            const { data: profileByEmail, error: errorByEmail } = await supabase
              .from('profiles')
              .select('is_admin, first_name, last_name, id, user_id, email')
              .eq('email', data.user.email)
              .single();
            
            if (!errorByEmail) {
              profile = profileByEmail;
              profileError = null;
            } else {
              profileError = errorByEmail;
            }
          }

          logger.log('[LoginForm] Profile data:', profile);
          logger.log('[LoginForm] Profile error:', profileError);

          if (profileError) {
            if (profileError.code === 'PGRST116') {
              logger.warn('[LoginForm] Profil non trouvé, utilisateur nouveau');
            } else {
              logger.error('[LoginForm] Erreur profil:', profileError);
            }
          }

          const isAdmin = profile?.is_admin === true;
          logger.log(`[LoginForm] User is admin: ${isAdmin}`);
          logger.log(`[LoginForm] Profile is_admin value:`, profile?.is_admin);
          logger.log(`[LoginForm] Profile is_admin type:`, typeof profile?.is_admin);
          logger.log(`[LoginForm] Profile details:`, {
            profile_id: profile?.id,
            user_id: profile?.user_id,
            auth_user_id: data.user.id,
            email: profile?.email,
            is_admin: profile?.is_admin
          });

          // Délai avant redirection pour éviter les erreurs de message channel
          setTimeout(() => {
            // Redirection basée sur le statut admin
            if (isAdmin) {
              logger.log('[LoginForm] Redirection vers admin');
              navigate('/admin', { replace: true });
            } else {
              logger.log('[LoginForm] Redirection vers dashboard utilisateur');
              navigate(from, { replace: true });
            }
          }, 500); // Augmenté le délai pour éviter les erreurs de message channel

        } catch (profileError) {
          logger.error('[LoginForm] Erreur lors de la vérification du profil:', profileError);
          // En cas d'erreur, rediriger vers le dashboard par défaut
          setTimeout(() => {
            logger.log('[LoginForm] Redirection par défaut vers dashboard');
            navigate(from, { replace: true });
          }, 500);
        }
      }
    } catch (error) {
      logger.error('[LoginForm] Erreur de connexion:', error);
      toast.error(error instanceof Error ? error.message : 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    navigate('/auth/forgot-password');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-sm mx-auto p-6">
      <div className="space-y-2">
        <Label htmlFor="email" className="text-base font-semibold">
          Email
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="votre@email.com"
          required
          aria-required="true"
          aria-invalid={email.length > 0 && !email.includes('@')}
          className="w-full"
          autoComplete="email"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-base font-semibold">
          Mot de passe
        </Label>
        <Input
          id="password"
          name="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          aria-required="true"
          minLength={8}
          className="w-full"
          autoComplete="current-password"
        />
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleForgotPassword}
          className="text-sm text-primary-600 hover:text-primary-800 hover:underline font-medium"
        >
          Mot de passe oublié ?
        </button>
      </div>

      <Button
        type="submit"
        className="w-full bg-primary text-white hover:bg-primary/90"
        disabled={isLoading}
      >
        {isLoading ? 'Connexion en cours...' : 'Se connecter'}
      </Button>
    </form>
  );
};

export default LoginForm;
