// Type pour les créneaux horaires de la base de données
export interface DbTimeSlot {
  id: string;
  label: string;
  start_time: string;
  end_time: string;
  duration: number;
  display_order: number;
  created_at: string;
  updated_at: string;
}

// Type pour les créneaux horaires utilisés dans l'interface
export interface TimeSlotOption {
  id: string;
  value: string;
  label: string;
  price: number;
  duration: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
  space_id: string;
  display_order: number;
}

// Type pour les créneaux horaires personnalisés
export interface CustomTimeSlot {
  value: string;
  label: string;
  duration: number;
}

// Fonction de conversion de DbTimeSlot vers TimeSlotOption
export const convertToTimeSlotOption = (slot: DbTimeSlot): TimeSlotOption => ({
  id: slot.id,
  value: slot.id,
  label: slot.label,
  price: 0, // À remplacer par le prix réel
  duration: slot.duration,
  start_time: slot.start_time,
  end_time: slot.end_time,
  is_available: true,
  space_id: '', // À remplacer par l'ID de l'espace réel
  display_order: slot.display_order
});

// Fonction pour créer un créneau horaire personnalisé
export const createCustomTimeSlot = (hours: number): TimeSlotOption => ({
  id: `custom-${hours}`,
  value: `custom-${hours}`,
  label: `${hours} heure${hours > 1 ? 's' : ''}`,
  duration: hours,
  price: 0,
  start_time: '00:00',
  end_time: '23:59',
  is_available: true,
  space_id: '',
  display_order: 0
}); 