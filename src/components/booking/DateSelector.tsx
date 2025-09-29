import { useState, useEffect, useCallback, useRef } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { useTimeSlots } from "@/hooks/useTimeSlots";
import { useSpaceAvailability } from "@/hooks/useSpaceAvailability";
import { cn } from "@/lib/utils";
import { withRetry } from "@/utils/supabaseUtils";

import type { Space } from "@/components/admin/spaces/types";

interface DateSelectorProps {
  selected: Date | undefined;
  onSelect: (date: Date | undefined) => void;
  timeSlots: any[];
  selectedSlot: string;
  onSlotSelect: (slot: string) => void;
  spaceId?: string;
  space?: Space;
}

export const DateSelector = ({
  selected,
  onSelect,
  timeSlots,
  selectedSlot,
  onSlotSelect,
  spaceId,
  space
}: DateSelectorProps) => {
  console.log('🔍 DateSelector reçu:', { timeSlotsLength: timeSlots.length, timeSlots, selectedSlot });
  const [customHours, setCustomHours] = useState<string>("");
  const { setCustomDuration, getCurrentSlotDuration } = useTimeSlots();
  const { checkAvailability } = useSpaceAvailability(spaceId || "");
  const [availability, setAvailability] = useState<{
    isAvailable: boolean;
    availableCapacity: number;
    totalCapacity: number;
  } | null>(null);

  // Cache des résultats de disponibilité
  const availabilityCache = useRef<{
    [key: string]: {
      timestamp: number;
      result: {
        isAvailable: boolean;
        availableCapacity: number;
        totalCapacity: number;
      };
    };
  }>({});

  // Fonction pour générer une clé de cache unique
  const getCacheKey = useCallback((date: Date, spaceId: string, duration: number) => {
    return `${date.toISOString()}_${spaceId}_${duration}`;
  }, []);

  // Vérification de disponibilité avec debounce et cache
  const checkCurrentAvailability = useCallback(async () => {
    if (!selected || !spaceId || !selectedSlot) {
      setAvailability(null);
      return;
    }

    const duration = getCurrentSlotDuration();
    if (duration === 0) return;

    const cacheKey = getCacheKey(selected, spaceId, duration);

    // Vérifier le cache (valide pendant 5 minutes)
    const cachedResult = availabilityCache.current[cacheKey];
    if (cachedResult && Date.now() - cachedResult.timestamp < 5 * 60 * 1000) {
      setAvailability(cachedResult.result);
      return;
    }

    try {
      const result = await withRetry(async () => {
        return await checkAvailability({
          startDate: selected,
          endDate: new Date(selected.getTime() + duration * 60 * 60 * 1000),
          spaceId
        });
      });

      const availabilityResult = {
        isAvailable: result.isAvailable,
        availableCapacity: result.availableCapacity,
        totalCapacity: result.totalCapacity
      };

      // Mettre en cache le résultat
      availabilityCache.current[cacheKey] = {
        timestamp: Date.now(),
        result: availabilityResult
      };

      setAvailability(availabilityResult);
    } catch (error) {
      console.error("Erreur lors de la vérification de disponibilité:", error);
      setAvailability({
        isAvailable: true,
        availableCapacity: 1,
        totalCapacity: 1
      });
    }
  }, [selected, spaceId, selectedSlot, getCurrentSlotDuration, getCacheKey, checkAvailability]);

  useEffect(() => {
    const timeoutId = setTimeout(checkCurrentAvailability, 1000);
    return () => clearTimeout(timeoutId);
  }, [checkCurrentAvailability]);

  // Gérer les créneaux personnalisés
  useEffect(() => {
    if (!selectedSlot) return;

    if (typeof selectedSlot === 'string' && selectedSlot.startsWith('custom-')) {
      const hours = selectedSlot.split('-')[1];
      setCustomHours(hours);
    } else {
      setCustomHours("");
    }
  }, [selectedSlot]);

  const handleCustomHoursChange = (value: string) => {
    const hours = parseInt(value);
    setCustomHours(value);
    if (!isNaN(hours) && hours > 0) {
      setCustomDuration(hours);
      onSlotSelect(`custom-${hours}`);
    }
  };

  const handleSlotChange = (value: string) => {
    if (value === 'custom') {
      // Si on a déjà une valeur personnalisée, on la réutilise
      if (customHours) {
        const hours = parseInt(customHours);
        if (!isNaN(hours) && hours > 0) {
          onSlotSelect(`custom-${hours}`);
          return;
        }
      }
      // Sinon on met une valeur par défaut de 1 heure
      setCustomHours("1");
      setCustomDuration(1);
      onSlotSelect("custom-1");
    } else {
      onSlotSelect(value);
    }
  };

  const isCustomSlot = typeof selectedSlot === 'string' && selectedSlot.startsWith('custom-');

  return (
    <div className="space-y-6">
      <div>
        <Label>Date</Label>
        <Calendar
          mode="single"
          selected={selected}
          onSelect={onSelect}
          className="rounded-md border mt-2"
          disabled={(date) => date < new Date()}
        />
      </div>

      {space?.pricing_type === "hourly" ? (
        <>
          <RadioGroup
            value={isCustomSlot ? 'custom' : selectedSlot}
            onValueChange={handleSlotChange}
            className="grid grid-cols-2 gap-4 mt-2"
          >
            {timeSlots.filter(slot => !slot.label.includes('Matin') && !slot.label.includes('Après-midi') && !slot.label.includes('Journée')).map((slot, idx) => (
              <div key={slot.value || idx} className="flex items-center space-x-2">
                <RadioGroupItem value={slot.value} id={slot.value} />
                <Label htmlFor={slot.value}>{slot.label}</Label>
              </div>
            ))}
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="custom" id="custom" />
              <Label htmlFor="custom">Personnalisé</Label>
            </div>
          </RadioGroup>

          {isCustomSlot && (
            <div className="mt-4 flex items-center space-x-2">
              <Input
                type="number"
                min="1"
                max="24"
                value={customHours}
                onChange={(e) => handleCustomHoursChange(e.target.value)}
                placeholder="Nombre d'heures"
                className="w-40"
              />
              <span>heure(s)</span>
            </div>
          )}
        </>
      ) : (
        <RadioGroup
          value={selectedSlot}
          onValueChange={onSlotSelect}
          className="grid grid-cols-2 gap-4 mt-2"
        >
          {timeSlots.map((slot) => (
            <div key={slot.value} className="flex items-center space-x-2">
              <RadioGroupItem value={slot.value} id={slot.value} />
              <Label htmlFor={slot.value}>{slot.label}</Label>
            </div>
          ))}
        </RadioGroup>
      )}

      {availability && (
        <div className={cn(
          "p-4 rounded-md border",
          availability.isAvailable ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
        )}>
          <p className={cn(
            "text-sm font-medium",
            availability.isAvailable ? "text-green-800" : "text-red-800"
          )}>
            {availability.isAvailable
              ? `Disponible (${availability.availableCapacity}/${availability.totalCapacity} places)`
              : "Non disponible"}
          </p>
        </div>
      )}
    </div>
  );
};