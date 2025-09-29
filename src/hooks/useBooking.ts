import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api-client";
import type { TimeSlotOption } from "@/types/booking";

export function useBooking(spaceId: string | undefined) {
  const [space, setSpace] = useState<any>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlotOption[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlotOption | null>(null);
  const [loading, setLoading] = useState(false);

  // 1. Charger l'espace et ses tarifs
  useEffect(() => {
    if (!spaceId) return;
    setLoading(true);
    
    const fetchSpace = async () => {
      try {
        const response = await apiClient.get(`/spaces/${spaceId}`);
        if (response.success) {
          setSpace(response.data);
        }
      } catch (error) {
        console.error('Erreur lors du chargement de l\'espace:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSpace();
  }, [spaceId]);

  // 2. Générer dynamiquement les créneaux selon le type de tarification
  useEffect(() => {
    if (!space) return;
    let slots: TimeSlotOption[] = [];
    
    // Détecter automatiquement le type de tarification si non défini
    let pricingType = space.pricing_type;
    if (!pricingType) {
      if (space.hourly_price) pricingType = "hourly";
      else if (space.daily_price) pricingType = "daily";
      else if (space.half_day_price) pricingType = "half_day";
      else if (space.monthly_price) pricingType = "monthly";
      else if (space.quarter_price) pricingType = "quarter";
      else if (space.yearly_price) pricingType = "yearly";
      else if (space.custom_price) pricingType = "custom";
    }
    
    switch (pricingType) {
      case "hourly":
        slots = [
          { id: "1", label: "09:00 - 10:00", startTime: "09:00", endTime: "10:00", price: space.hourly_price, isAvailable: true },
          { id: "2", label: "10:00 - 11:00", startTime: "10:00", endTime: "11:00", price: space.hourly_price, isAvailable: true },
          { id: "3", label: "11:00 - 12:00", startTime: "11:00", endTime: "12:00", price: space.hourly_price, isAvailable: true },
          { id: "4", label: "14:00 - 15:00", startTime: "14:00", endTime: "15:00", price: space.hourly_price, isAvailable: true },
          { id: "5", label: "15:00 - 16:00", startTime: "15:00", endTime: "16:00", price: space.hourly_price, isAvailable: true },
          { id: "6", label: "16:00 - 17:00", startTime: "16:00", endTime: "17:00", price: space.hourly_price, isAvailable: true },
        ];
        break;
      case "half_day":
        slots = [
          { id: "morning", label: "Matin (9h-13h)", startTime: "09:00", endTime: "13:00", price: space.half_day_price, isAvailable: true },
          { id: "afternoon", label: "Après-midi (14h-18h)", startTime: "14:00", endTime: "18:00", price: space.half_day_price, isAvailable: true },
        ];
        break;
      case "daily":
        slots = [
          { id: "full-day", label: "Journée complète (9h-18h)", startTime: "09:00", endTime: "18:00", price: space.daily_price, isAvailable: true },
        ];
        break;
      case "monthly":
        slots = [
          { id: "monthly", label: "Mois complet", startTime: "00:00", endTime: "23:59", price: space.monthly_price, isAvailable: true },
        ];
        break;
      case "quarter":
        slots = [
          { id: "quarter", label: "Trimestre", startTime: "00:00", endTime: "23:59", price: space.quarter_price, isAvailable: true },
        ];
        break;
      case "yearly":
        slots = [
          { id: "yearly", label: "Année", startTime: "00:00", endTime: "23:59", price: space.yearly_price, isAvailable: true },
        ];
        break;
      case "custom":
        slots = [
          { id: "custom", label: space.custom_label || "Période personnalisée", startTime: "00:00", endTime: "23:59", price: space.custom_price, isAvailable: true },
        ];
        break;
      default:
        // Si aucun type de tarification n'est défini, générer des créneaux par défaut
        if (space.price_per_hour) {
          slots = [
            { id: "1", label: "09:00 - 10:00", startTime: "09:00", endTime: "10:00", price: space.price_per_hour, isAvailable: true },
            { id: "2", label: "10:00 - 11:00", startTime: "10:00", endTime: "11:00", price: space.price_per_hour, isAvailable: true },
            { id: "3", label: "11:00 - 12:00", startTime: "11:00", endTime: "12:00", price: space.price_per_hour, isAvailable: true },
            { id: "4", label: "14:00 - 15:00", startTime: "14:00", endTime: "15:00", price: space.price_per_hour, isAvailable: true },
            { id: "5", label: "15:00 - 16:00", startTime: "15:00", endTime: "16:00", price: space.price_per_hour, isAvailable: true },
            { id: "6", label: "16:00 - 17:00", startTime: "16:00", endTime: "17:00", price: space.price_per_hour, isAvailable: true },
          ];
        } else {
          slots = [];
        }
        break;
    }
    setTimeSlots(slots);
  }, [space]);

  return {
    space,
    timeSlots,
    selectedSlot,
    setSelectedSlot,
    loading,
  };
} 