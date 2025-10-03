import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdminStats } from "@/hooks/useAdminStats";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Users, Building2, Calendar, DollarSign } from "lucide-react";

interface AdminStatsProps {
    mode: 'test' | 'live' | 'all';
}

export const AdminStats = ({ mode }: AdminStatsProps) => {
    const { stats, loading, error } = useAdminStats(mode);
    
    console.log('🔍 AdminStats rendu avec mode:', mode);
    console.log('🔍 AdminStats - stats:', stats);
    console.log('🔍 AdminStats - loading:', loading);
    console.log('🔍 AdminStats - error:', error);

    // Fonction utilitaire pour formater les nombres
    const formatNumber = (num: number | null | undefined): string => {
        if (num === null || num === undefined) return '0';
        return num.toLocaleString('fr-FR');
    };

    // Fonction utilitaire pour formater les montants
    const formatAmount = (amount: number | null | undefined): string => {
        if (amount === null || amount === undefined) return '0 €';
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR'
        }).format(amount);
    };

    // Composant de chargement
    const LoadingSkeleton = () => (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, index) => (
                <Card key={index}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            <Skeleton className="h-4 w-[100px]" />
                        </CardTitle>
                        <Skeleton className="h-8 w-8 rounded-full" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-8 w-[120px]" />
                        <Skeleton className="mt-2 h-4 w-[80px]" />
                    </CardContent>
                </Card>
            ))}
        </div>
    );

    // Composant d'erreur
    const ErrorDisplay = () => (
        <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erreur</AlertTitle>
            <AlertDescription>
                {error || "Une erreur est survenue lors du chargement des statistiques"}
            </AlertDescription>
        </Alert>
    );

    // Composant de statistiques
    const StatsDisplay = () => (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Utilisateurs</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatNumber(stats?.total_users)}</div>
                    <p className="text-xs text-muted-foreground">
                        {formatNumber(stats?.active_users)} utilisateurs actifs
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Espaces</CardTitle>
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatNumber(stats?.total_spaces)}</div>
                    <p className="text-xs text-muted-foreground">
                        {formatNumber(stats?.available_spaces)} espaces disponibles
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Réservations</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatNumber(stats?.total_bookings)}</div>
                    <p className="text-xs text-muted-foreground">
                        {formatNumber(stats?.active_bookings)} réservations actives
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Revenus</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatAmount(stats?.total_revenue)}</div>
                    <p className="text-xs text-muted-foreground">
                        {formatAmount(stats?.monthly_revenue)} ce mois-ci
                    </p>
                </CardContent>
            </Card>
        </div>
    );

    // Affichage conditionnel
    console.log('🔍 AdminStats - État du rendu:');
    console.log('  - loading:', loading);
    console.log('  - error:', error);
    console.log('  - stats:', stats);
    console.log('  - stats existe:', !!stats);
    
    if (loading) {
        console.log('🔍 AdminStats - Affichage du skeleton de chargement');
        return <LoadingSkeleton />;
    }

    if (error) {
        console.log('🔍 AdminStats - Affichage de l\'erreur:', error);
        return <ErrorDisplay />;
    }

    console.log('🔍 AdminStats - Affichage des statistiques');
    return <StatsDisplay />;
}; 