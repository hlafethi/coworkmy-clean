import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTimeSlots } from "@/hooks/useTimeSlots";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Clock } from "lucide-react";

interface TimeSlot {
    id: string;
    label: string;
    start_time: string;
    end_time: string;
    display_order: number;
}

const DEFAULT_TIME_SLOTS: TimeSlot[] = [
    { id: '1', label: '9h00 - 10h00', start_time: '09:00', end_time: '10:00', display_order: 1 },
    { id: '2', label: '10h00 - 11h00', start_time: '10:00', end_time: '11:00', display_order: 2 },
    { id: '3', label: '11h00 - 12h00', start_time: '11:00', end_time: '12:00', display_order: 3 },
    { id: '4', label: '14h00 - 15h00', start_time: '14:00', end_time: '15:00', display_order: 4 },
    { id: '5', label: '15h00 - 16h00', start_time: '15:00', end_time: '16:00', display_order: 5 },
    { id: '6', label: '16h00 - 17h00', start_time: '16:00', end_time: '17:00', display_order: 6 }
];

export const TimeSlots = () => {
    const { timeSlots, loading, error } = useTimeSlots();

    // Composant de chargement
    const LoadingSkeleton = () => (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg font-semibold">
                    <Skeleton className="h-6 w-[200px]" />
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {[...Array(6)].map((_, index) => (
                        <div key={index} className="flex items-center justify-between">
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-[150px]" />
                                <Skeleton className="h-3 w-[100px]" />
                            </div>
                            <Skeleton className="h-4 w-[80px]" />
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );

    // Composant d'erreur
    const ErrorDisplay = () => (
        <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erreur</AlertTitle>
            <AlertDescription>
                {error || "Une erreur est survenue lors du chargement des créneaux horaires"}
            </AlertDescription>
        </Alert>
    );

    // Composant de données
    const TimeSlotsDisplay = () => {
        const slots = timeSlots?.length ? timeSlots : DEFAULT_TIME_SLOTS;

        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg font-semibold">Créneaux Horaires</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {slots.map((slot) => (
                            <div key={slot.id} className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium">{slot.label}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {slot.start_time} - {slot.end_time}
                                    </p>
                                </div>
                                <Clock className="h-4 w-4 text-muted-foreground" />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    };

    if (loading) {
        return <LoadingSkeleton />;
    }

    if (error) {
        return <ErrorDisplay />;
    }

    return <TimeSlotsDisplay />;
}; 