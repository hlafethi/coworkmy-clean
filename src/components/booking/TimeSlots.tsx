import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { initializeTimeSlots } from "@/utils/timeSlotsUtils";

interface TimeSlot {
    id: string;
    start_time: string;
    end_time: string;
    is_available: boolean;
    label: string;
    display_order: number;
    space_id: string;
}

export const TimeSlots = ({ spaceId }: { spaceId: string }) => {
    const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchTimeSlots = async () => {
        try {
            setLoading(true);
            setError(null);

            // Réinitialiser complètement les créneaux
            await initializeTimeSlots(spaceId);

            // Récupération avec le nouvel ordre
            const { data, error } = await supabase
                .from('time_slots')
                .select('*')
                .eq('space_id', spaceId)
                .order('display_order', { ascending: true });

            if (error) {
                console.error('Erreur Supabase:', error);
                throw error;
            }

            setTimeSlots(data || []);
        } catch (error) {
            console.error('Erreur lors du chargement des créneaux:', error);
            setError('Erreur lors du chargement des créneaux horaires');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (spaceId) {
            fetchTimeSlots();
        }
    }, [spaceId]);

    if (loading) return <div>Chargement des créneaux...</div>;
    if (error) return <div>Erreur: {error}</div>;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {timeSlots.map((slot) => (
                <div
                    key={slot.id}
                    className={`p-4 rounded-lg border ${slot.is_available
                        ? 'bg-green-50 border-green-200'
                        : 'bg-red-50 border-red-200'
                        }`}
                >
                    <div className="font-medium">
                        {slot.label}
                    </div>
                    <div className="text-sm text-gray-600">
                        {slot.is_available ? 'Disponible' : 'Réservé'}
                    </div>
                </div>
            ))}
        </div>
    );
}; 