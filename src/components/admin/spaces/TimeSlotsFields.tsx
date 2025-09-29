import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Control } from "react-hook-form";
import { PricingType, SpaceFormValues } from "./types";
import React, { useState, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";

interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  label: string;
}

interface TimeSlotsFieldsProps {
  control: Control<SpaceFormValues>;
  pricingType: PricingType;
  onTimeSlotsChange?: (timeSlots: TimeSlot[]) => void;
}

export const TimeSlotsFields = ({ control, pricingType, onTimeSlotsChange }: TimeSlotsFieldsProps) => {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);

  const addTimeSlot = () => {
    const newSlot: TimeSlot = {
      id: Date.now().toString(),
      startTime: "09:00",
      endTime: "17:00",
      label: ""
    };
    const updatedSlots = [...timeSlots, newSlot];
    setTimeSlots(updatedSlots);
    onTimeSlotsChange?.(updatedSlots);
  };

  const removeTimeSlot = (id: string) => {
    const updatedSlots = timeSlots.filter(slot => slot.id !== id);
    setTimeSlots(updatedSlots);
    onTimeSlotsChange?.(updatedSlots);
  };

  const updateTimeSlot = (id: string, field: keyof TimeSlot, value: string) => {
    const updatedSlots = timeSlots.map(slot => 
      slot.id === id ? { ...slot, [field]: value } : slot
    );
    setTimeSlots(updatedSlots);
    onTimeSlotsChange?.(updatedSlots);
  };

  // Générer des créneaux par défaut selon le type de tarif
  const generateDefaultSlots = () => {
    let defaultSlots: TimeSlot[] = [];

    switch (pricingType) {
      case "hourly":
        defaultSlots = [
          { id: "1", startTime: "09:00", endTime: "10:00", label: "09:00 - 10:00" },
          { id: "2", startTime: "10:00", endTime: "11:00", label: "10:00 - 11:00" },
          { id: "3", startTime: "11:00", endTime: "12:00", label: "11:00 - 12:00" },
          { id: "4", startTime: "14:00", endTime: "15:00", label: "14:00 - 15:00" },
          { id: "5", startTime: "15:00", endTime: "16:00", label: "15:00 - 16:00" },
          { id: "6", startTime: "16:00", endTime: "17:00", label: "16:00 - 17:00" }
        ];
        break;
      
      case "half_day":
        defaultSlots = [
          { id: "morning", startTime: "09:00", endTime: "13:00", label: "Matin (9h-13h)" },
          { id: "afternoon", startTime: "14:00", endTime: "18:00", label: "Après-midi (14h-18h)" }
        ];
        break;
      
      case "daily":
        defaultSlots = [
          { id: "full-day", startTime: "09:00", endTime: "18:00", label: "Journée complète (9h-18h)" }
        ];
        break;
      
      case "monthly":
      case "quarter":
      case "yearly":
        defaultSlots = [
          { id: "full-period", startTime: "00:00", endTime: "23:59", label: "Période complète" }
        ];
        break;
      
      case "custom":
        defaultSlots = [
          { id: "custom-1", startTime: "09:00", endTime: "17:00", label: "Période personnalisée" }
        ];
        break;
    }

    setTimeSlots(defaultSlots);
  };

  // Générer les créneaux par défaut au premier rendu
  useEffect(() => {
    if (timeSlots.length === 0) {
      generateDefaultSlots();
    }
  }, [pricingType]);

  if (pricingType === "hourly") {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <FormLabel>Créneaux horaires disponibles</FormLabel>
          <Button type="button" variant="outline" size="sm" onClick={addTimeSlot}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un créneau
          </Button>
        </div>
        
        {timeSlots.map((slot) => (
          <div key={slot.id} className="flex items-center space-x-2 p-3 border rounded-lg">
            <div className="flex-1 grid grid-cols-3 gap-2">
              <Input
                type="time"
                value={slot.startTime}
                onChange={(e) => updateTimeSlot(slot.id, "startTime", e.target.value)}
                placeholder="Début"
              />
              <Input
                type="time"
                value={slot.endTime}
                onChange={(e) => updateTimeSlot(slot.id, "endTime", e.target.value)}
                placeholder="Fin"
              />
              <Input
                value={slot.label}
                onChange={(e) => updateTimeSlot(slot.id, "label", e.target.value)}
                placeholder="Libellé (ex: 9h-10h)"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => removeTimeSlot(slot.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    );
  }

  if (pricingType === "half_day") {
    return (
      <div className="space-y-4">
        <FormLabel>Créneaux demi-journée</FormLabel>
        {timeSlots.map((slot) => (
          <div key={slot.id} className="flex items-center space-x-2 p-3 border rounded-lg">
            <div className="flex-1 grid grid-cols-3 gap-2">
              <Input
                type="time"
                value={slot.startTime}
                onChange={(e) => updateTimeSlot(slot.id, "startTime", e.target.value)}
                placeholder="Début"
              />
              <Input
                type="time"
                value={slot.endTime}
                onChange={(e) => updateTimeSlot(slot.id, "endTime", e.target.value)}
                placeholder="Fin"
              />
              <Input
                value={slot.label}
                onChange={(e) => updateTimeSlot(slot.id, "label", e.target.value)}
                placeholder="Libellé"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => removeTimeSlot(slot.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    );
  }

  if (pricingType === "daily") {
    return (
      <div className="space-y-4">
        <FormLabel>Créneaux journaliers</FormLabel>
        {timeSlots.map((slot) => (
          <div key={slot.id} className="flex items-center space-x-2 p-3 border rounded-lg">
            <div className="flex-1 grid grid-cols-3 gap-2">
              <Input
                type="time"
                value={slot.startTime}
                onChange={(e) => updateTimeSlot(slot.id, "startTime", e.target.value)}
                placeholder="Début"
              />
              <Input
                type="time"
                value={slot.endTime}
                onChange={(e) => updateTimeSlot(slot.id, "endTime", e.target.value)}
                placeholder="Fin"
              />
              <Input
                value={slot.label}
                onChange={(e) => updateTimeSlot(slot.id, "label", e.target.value)}
                placeholder="Libellé"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => removeTimeSlot(slot.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    );
  }

  if (pricingType === "custom") {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <FormLabel>Créneaux personnalisés</FormLabel>
          <Button type="button" variant="outline" size="sm" onClick={addTimeSlot}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un créneau
          </Button>
        </div>
        
        {timeSlots.map((slot) => (
          <div key={slot.id} className="flex items-center space-x-2 p-3 border rounded-lg">
            <div className="flex-1 grid grid-cols-3 gap-2">
              <Input
                type="time"
                value={slot.startTime}
                onChange={(e) => updateTimeSlot(slot.id, "startTime", e.target.value)}
                placeholder="Début"
              />
              <Input
                type="time"
                value={slot.endTime}
                onChange={(e) => updateTimeSlot(slot.id, "endTime", e.target.value)}
                placeholder="Fin"
              />
              <Input
                value={slot.label}
                onChange={(e) => updateTimeSlot(slot.id, "label", e.target.value)}
                placeholder="Libellé"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => removeTimeSlot(slot.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    );
  }

  // Pour monthly, quarter, yearly - pas de créneaux horaires spécifiques
  return null;
};
