import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

export default function Callback() {
    const navigate = useNavigate();
    const { checkSession } = useAuth();

    useEffect(() => {
        const handleCallback = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();

                if (error) {
                    throw error;
                }

                if (session) {
                    await checkSession();
                    toast.success('Connexion réussie');
                    navigate('/dashboard');
                } else {
                    toast.error('Session non trouvée');
                    navigate('/auth/login');
                }
            } catch (error) {
                logger.error('Erreur lors de la connexion:', error);
                toast.error('Erreur lors de la connexion');
                navigate('/auth/login');
            }
        };

        handleCallback();
    }, [navigate, checkSession]);

    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
                <h1 className="text-2xl font-bold mb-4">Connexion en cours...</h1>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            </div>
        </div>
    );
} 