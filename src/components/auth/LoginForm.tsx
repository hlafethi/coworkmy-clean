import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContextPostgreSQL';
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
  const { signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!email.trim() || !password) {
        throw new Error('Veuillez remplir tous les champs');
      }

      logger.log('[LoginForm] Tentative de connexion...');

      const result = await signIn(email.trim(), password.trim());

      if (result.user && !result.error) {
        logger.log('[LoginForm] Connexion réussie');
        logger.log('[LoginForm] User ID:', result.user?.id);
        logger.log('[LoginForm] User email:', result.user?.email);
        toast.success('Connexion réussie');
        
        // Rediriger vers la page demandée
        navigate(from, { replace: true });
      } else {
        throw new Error(result.error || 'Erreur de connexion');
      }

    } catch (error) {
      logger.error('[LoginForm] Erreur de connexion:', error);
      
      let errorMessage = 'Erreur de connexion';
      
      if (error instanceof Error) {
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = 'Email ou mot de passe incorrect';
        } else if (error.message.includes('rate limit')) {
          errorMessage = 'Trop de tentatives. Veuillez réessayer plus tard';
        } else {
          errorMessage = error.message;
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="votre@email.com"
          required
          disabled={isLoading}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="password">Mot de passe</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
          disabled={isLoading}
        />
      </div>
      
      <Button 
        type="submit" 
        className="w-full" 
        disabled={isLoading}
      >
        {isLoading ? 'Connexion...' : 'Se connecter'}
      </Button>
    </form>
  );
};

export default LoginForm;