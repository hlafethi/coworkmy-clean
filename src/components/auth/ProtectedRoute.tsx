import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContextNew';
import LoadingSpinner from '@/components/common/LoadingSpinner';

const ProtectedRoute = () => {
    const { user, loading, profileLoaded } = useAuth();

    if (loading || !profileLoaded) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <LoadingSpinner />
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/auth/login" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute; 