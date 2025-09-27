import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContextNew';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { useEffect, useRef } from 'react';

const AdminRoute = () => {
    const { user, isAdmin, loading, profileLoaded } = useAuth();
    const hasRedirected = useRef(false);

    // Réinitialiser le flag de redirection quand l'utilisateur change
    useEffect(() => {
        hasRedirected.current = false;
    }, [user?.id]);

    // Afficher le loading pendant l'initialisation
    if (loading || !profileLoaded) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <LoadingSpinner />
            </div>
        );
    }

    // Redirection si pas d'utilisateur
    if (!user) {
        if (!hasRedirected.current) {
            hasRedirected.current = true;
        }
        return <Navigate to="/auth/login" replace />;
    }

    // Redirection si pas admin
    if (!isAdmin) {
        if (!hasRedirected.current) {
            hasRedirected.current = true;
        }
        return <Navigate to="/dashboard" replace />;
    }

    return <Outlet />;
};

export default AdminRoute; 