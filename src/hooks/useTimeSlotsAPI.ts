import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api-client";
import type { TimeSlotOption } from "@/types/timeSlots";

export function useTimeSlotsAPI(spaceId?: string) {
  const [timeSlots, setTimeSlots] = useState<TimeSlotOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('🔍 useTimeSlotsAPI useEffect:', { spaceId });
    
    // Générer des créneaux même sans spaceId pour l'édition
    if (!spaceId) {
      console.log('⚠️ Aucun spaceId, génération de créneaux par défaut');
      const defaultSlots: TimeSlotOption[] = [
        { 
          id: '1', 
          label: '09:00 - 10:00', 
          startTime: '09:00', 
          endTime: '10:00', 
          price: 0, 
          isAvailable: true,
          value: '1'
        },
        { 
          id: '2', 
          label: '10:00 - 11:00', 
          startTime: '10:00', 
          endTime: '11:00', 
          price: 0, 
          isAvailable: true,
          value: '2'
        },
        { 
          id: '3', 
          label: '11:00 - 12:00', 
          startTime: '11:00', 
          endTime: '12:00', 
          price: 0, 
          isAvailable: true,
          value: '3'
        },
        { 
          id: '4', 
          label: '14:00 - 15:00', 
          startTime: '14:00', 
          endTime: '15:00', 
          price: 0, 
          isAvailable: true,
          value: '4'
        },
        { 
          id: '5', 
          label: '15:00 - 16:00', 
          startTime: '15:00', 
          endTime: '16:00', 
          price: 0, 
          isAvailable: true,
          value: '5'
        },
        { 
          id: '6', 
          label: '16:00 - 17:00', 
          startTime: '16:00', 
          endTime: '17:00', 
          price: 0, 
          isAvailable: true,
          value: '6'
        }
      ];
      console.log('🔍 Créneaux par défaut générés:', defaultSlots);
      setTimeSlots(defaultSlots);
      return;
    }

    const fetchTimeSlots = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Pour l'instant, générer des créneaux par défaut
        // TODO: Récupérer les créneaux depuis l'API si nécessaire
        const defaultSlots: TimeSlotOption[] = [
          { 
            id: '1', 
            label: '09:00 - 10:00', 
            startTime: '09:00', 
            endTime: '10:00', 
            price: 0, 
            isAvailable: true,
            value: '1'
          },
          { 
            id: '2', 
            label: '10:00 - 11:00', 
            startTime: '10:00', 
            endTime: '11:00', 
            price: 0, 
            isAvailable: true,
            value: '2'
          },
          { 
            id: '3', 
            label: '11:00 - 12:00', 
            startTime: '11:00', 
            endTime: '12:00', 
            price: 0, 
            isAvailable: true,
            value: '3'
          },
          { 
            id: '4', 
            label: '14:00 - 15:00', 
            startTime: '14:00', 
            endTime: '15:00', 
            price: 0, 
            isAvailable: true,
            value: '4'
          },
          { 
            id: '5', 
            label: '15:00 - 16:00', 
            startTime: '15:00', 
            endTime: '16:00', 
            price: 0, 
            isAvailable: true,
            value: '5'
          },
          { 
            id: '6', 
            label: '16:00 - 17:00', 
            startTime: '16:00', 
            endTime: '17:00', 
            price: 0, 
            isAvailable: true,
            value: '6'
          }
        ];
        
        console.log('🔍 Créneaux générés:', defaultSlots);
        setTimeSlots(defaultSlots);
      } catch (err) {
        console.error('Erreur chargement créneaux:', err);
        setError('Erreur lors du chargement des créneaux');
      } finally {
        setLoading(false);
      }
    };

    fetchTimeSlots();
  }, [spaceId]);

  return {
    timeSlots,
    loading,
    error
  };
}
