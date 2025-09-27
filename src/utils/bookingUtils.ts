import type { Space } from "@/components/admin/spaces/types";

export const getTimeSlotTimes = (selectedDate: Date, timeSlotLabel: string): { startTime: Date, endTime: Date } => {
  const startTime = new Date(selectedDate);
  const endTime = new Date(selectedDate);

  if (!timeSlotLabel) {
    startTime.setHours(9, 0, 0, 0);
    endTime.setHours(18, 0, 0, 0);
    return { startTime, endTime };
  }

  startTime.setHours(0, 0, 0, 0); // Début à minuit
  endTime.setHours(23, 59, 59, 999); // Fin à 23:59:59.999

  // Gérer les créneaux personnalisés (ex: "3 heures")
  const customMatch = timeSlotLabel.match(/(\d+)\s*heure/);
  if (customMatch) {
    const hours = parseInt(customMatch[1]);
    startTime.setHours(9, 0, 0); // Commence à 9h
    endTime.setTime(startTime.getTime() + (hours * 60 * 60 * 1000));
    return { startTime, endTime };
  }

  // Gérer les créneaux horaires spécifiques (ex: "9h-18h")
  const timeMatch = timeSlotLabel.match(/\((\d{1,2})h-(\d{1,2})h\)/);
  if (timeMatch) {
    const startHour = parseInt(timeMatch[1]);
    const endHour = parseInt(timeMatch[2]);
    startTime.setHours(startHour, 0, 0);
    endTime.setHours(endHour, 0, 0);
    return { startTime, endTime };
  }

  // Gérer les périodes spéciales
  if (timeSlotLabel.includes("Mois")) {
    endTime.setMonth(endTime.getMonth() + 1);
  } else if (timeSlotLabel.includes("Trimestre")) {
    endTime.setMonth(endTime.getMonth() + 3);
  } else if (timeSlotLabel.includes("Année")) {
    endTime.setFullYear(endTime.getFullYear() + 1);
  } else if (timeSlotLabel.includes("Matin")) {
    startTime.setHours(9, 0, 0);
    endTime.setHours(13, 0, 0);
  } else if (timeSlotLabel.includes("Après-midi")) {
    startTime.setHours(14, 0, 0);
    endTime.setHours(18, 0, 0);
  } else {
    // Journée complète par défaut
    startTime.setHours(9, 0, 0);
    endTime.setHours(18, 0, 0);
  }

  return { startTime, endTime };
};

const VAT_RATE = 0.20; // 20% TVA

export const calculateTTC = (priceHT: number): number => {
  return priceHT * (1 + VAT_RATE);
};

export function formatPrice(value: number | undefined | null, currency: string = "EUR"): string {
  if (typeof value !== "number" || isNaN(value)) return "—";
  return value.toLocaleString("fr-FR", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export const getSpacePrice = (space: Space | undefined, duration?: number) => {
  if (!space) return { ht: 0, ttc: 0 };
  
  let priceHT = 0;
  switch (space.pricing_type) {
    case 'hourly':
      priceHT = (space.hourly_price || 0) * (duration || 1);
      break;
    case 'daily':
      priceHT = space.daily_price || 0;
      break;
    case 'monthly':
      priceHT = space.monthly_price || 0;
      break;
    case 'yearly':
      priceHT = space.yearly_price || 0;
      break;
    case 'half_day':
      priceHT = space.half_day_price || 0;
      break;
    case 'quarter':
      priceHT = space.quarter_price || 0;
      break;
    case 'custom':
      priceHT = space.custom_price || 0;
      break;
    default:
      priceHT = (space.hourly_price || 0) * (duration || 1);
  }

  return {
    ht: priceHT,
    ttc: calculateTTC(priceHT)
  };
};

export const getPricingLabel = (space: Space | undefined) => {
  if (!space) return '€';
  
  switch (space.pricing_type) {
    case 'hourly':
      return '€/h';
    case 'daily':
      return '€/jour';
    case 'monthly':
      return '€/mois';
    case 'yearly':
      return '€/an';
    case 'half_day':
      return '€/demi-j';
    case 'quarter':
      return '€/trim';
    case 'custom':
      return space.custom_label || '€';
    default:
      return '€/h';
  }
};
