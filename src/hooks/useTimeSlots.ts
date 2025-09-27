import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { PricingType } from "@/components/admin/spaces/types";
import type { DbTimeSlot } from "@/types/timeSlots";
import { convertToTimeSlotOption, createCustomTimeSlot } from "@/types/timeSlots";

const DEFAULT_TIME_SLOTS: DbTimeSlot[] = [
  { 
    id: '1', 
    label: '9h00 - 10h00', 
    start_time: '09:00', 
    end_time: '10:00', 
    display_order: 1,
    duration: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  { 
    id: '2', 
    label: '10h00 - 11h00', 
    start_time: '10:00', 
    end_time: '11:00', 
    display_order: 2,
    duration: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  { 
    id: '3', 
    label: '11h00 - 12h00', 
    start_time: '11:00', 
    end_time: '12:00', 
    display_order: 3,
    duration: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  { 
    id: '4', 
    label: '14h00 - 15h00', 
    start_time: '14:00', 
    end_time: '15:00', 
    display_order: 4,
    duration: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  { 
    id: '5', 
    label: '15h00 - 16h00', 
    start_time: '15:00', 
    end_time: '16:00', 
    display_order: 5,
    duration: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  { 
    id: '6', 
    label: '16h00 - 17h00', 
    start_time: '16:00', 
    end_time: '17:00', 
    display_order: 6,
    duration: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

const DEFAULT_OPTIONS: TimeSlotOption[] = [
  { 
    id: 'morning',
    label: "Matin (9h-13h)", 
    duration: 4,
    price: 0,
    start_time: '09:00',
    end_time: '13:00',
    is_available: true,
    space_id: '',
    display_order: 1
  },
  { 
    id: 'afternoon',
    label: "Après-midi (14h-18h)", 
    duration: 4,
    price: 0,
    start_time: '14:00',
    end_time: '18:00',
    is_available: true,
    space_id: '',
    display_order: 2
  },
  { 
    id: 'full-day',
    label: "Journée complète (9h-18h)", 
    duration: 9,
    price: 0,
    start_time: '09:00',
    end_time: '18:00',
    is_available: true,
    space_id: '',
    display_order: 3
  },
  { 
    id: 'monthly',
    label: "Mois complet", 
    duration: 720,
    price: 0,
    start_time: '00:00',
    end_time: '23:59',
    is_available: true,
    space_id: '',
    display_order: 4
  },
  { 
    id: 'quarter',
    label: "Trimestre", 
    duration: 2160,
    price: 0,
    start_time: '00:00',
    end_time: '23:59',
    is_available: true,
    space_id: '',
    display_order: 5
  },
  { 
    id: 'yearly',
    label: "Année", 
    duration: 8760,
    price: 0,
    start_time: '00:00',
    end_time: '23:59',
    is_available: true,
    space_id: '',
    display_order: 6
  }
];

export interface TimeSlotOption {
  id: string;
  label: string;
  duration: number;
  price: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
  space_id: string;
  display_order: number;
}

export const useTimeSlots = (pricingType?: PricingType) => {
  const [timeSlots, setTimeSlots] = useState<TimeSlotOption[]>([]);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [customHours, setCustomHours] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTimeSlots = async () => {
      try {
        setLoading(true);
        setError(null);
        let slots: TimeSlotOption[] = [];
        if (!pricingType || !['hourly', 'half_day', 'daily', 'monthly', 'quarter', 'yearly'].includes(pricingType)) {
          throw new Error('Type de tarification invalide');
        }
        switch (pricingType) {
          case 'hourly':
            const { data } = await supabase
              .from('time_slots')
              .select('*')
              .order('display_order', { ascending: true });
            slots = data?.length 
              ? (data as DbTimeSlot[]).map(convertToTimeSlotOption)
              : DEFAULT_TIME_SLOTS.map(convertToTimeSlotOption);
            break;
          case 'half_day':
            slots = DEFAULT_OPTIONS.filter(option => 
              option.id === "morning" || option.id === "afternoon"
            );
            break;
          case 'daily':
            slots = DEFAULT_OPTIONS.filter(option => 
              option.id === "full-day"
            );
            break;
          case 'monthly':
            slots = DEFAULT_OPTIONS.filter(option => 
              option.id === "monthly"
            );
            break;
          case 'quarter':
            slots = DEFAULT_OPTIONS.filter(option => 
              option.id === "quarter"
            );
            break;
          case 'yearly':
            slots = DEFAULT_OPTIONS.filter(option => 
              option.id === "yearly"
            );
            break;
          default:
            slots = [];
        }
        setTimeSlots(slots);
        setSelectedSlot(slots[0]?.id || '');
      } catch {
        setError('Erreur inconnue');
        setTimeSlots([]);
        setSelectedSlot('');
      } finally {
        setLoading(false);
      }
    };
    fetchTimeSlots();
  }, [pricingType]);

  const setCustomDuration = (hours: number) => {
    setCustomHours(hours);
    const customSlot = createCustomTimeSlot(hours);
    setTimeSlots(prev => {
      const filtered = prev.filter(slot => !String(slot.id).startsWith('custom-'));
      return [...filtered, customSlot];
    });
    setSelectedSlot(customSlot.id);
  };

  const getCurrentSlotDuration = () => {
    if (selectedSlot.startsWith('custom-')) {
      const hours = parseInt(selectedSlot.split('-')[1]);
      return isNaN(hours) ? 0 : hours;
    }
    const slot = timeSlots.find(s => s.id === selectedSlot);
    return slot?.duration || 0;
  };

  return {
    timeSlots,
    selectedSlot,
    setSelectedSlot,
    customHours,
    setCustomDuration,
    loading,
    error,
    getCurrentSlotDuration
  };
};
