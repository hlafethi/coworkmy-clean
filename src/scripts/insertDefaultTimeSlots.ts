import { supabase } from "@/integrations/supabase/client";
import { logger } from '@/utils/logger';

const SPACE_ID = "2edfb6ad-3959-423c-be20-213b23ff9a0f"; // ID de l'espace "Le Focus"

const DEFAULT_TIME_SLOTS = [
  {
    space_id: SPACE_ID,
    day_of_week: 1, // Lundi
    start_time: "09:00",
    end_time: "10:00",
    is_available: true
  },
  {
    space_id: SPACE_ID,
    day_of_week: 1,
    start_time: "10:00",
    end_time: "11:00",
    is_available: true
  },
  {
    space_id: SPACE_ID,
    day_of_week: 1,
    start_time: "11:00",
    end_time: "12:00",
    is_available: true
  },
  {
    space_id: SPACE_ID,
    day_of_week: 1,
    start_time: "14:00",
    end_time: "15:00",
    is_available: true
  },
  {
    space_id: SPACE_ID,
    day_of_week: 1,
    start_time: "15:00",
    end_time: "16:00",
    is_available: true
  },
  {
    space_id: SPACE_ID,
    day_of_week: 1,
    start_time: "16:00",
    end_time: "17:00",
    is_available: true
  },
  // Même créneaux pour les autres jours de la semaine (2-5)
  {
    space_id: SPACE_ID,
    day_of_week: 2, // Mardi
    start_time: "09:00",
    end_time: "10:00",
    is_available: true
  },
  {
    space_id: SPACE_ID,
    day_of_week: 2,
    start_time: "10:00",
    end_time: "11:00",
    is_available: true
  },
  {
    space_id: SPACE_ID,
    day_of_week: 2,
    start_time: "11:00",
    end_time: "12:00",
    is_available: true
  },
  {
    space_id: SPACE_ID,
    day_of_week: 2,
    start_time: "14:00",
    end_time: "15:00",
    is_available: true
  },
  {
    space_id: SPACE_ID,
    day_of_week: 2,
    start_time: "15:00",
    end_time: "16:00",
    is_available: true
  },
  {
    space_id: SPACE_ID,
    day_of_week: 2,
    start_time: "16:00",
    end_time: "17:00",
    is_available: true
  },
  // Mercredi
  {
    space_id: SPACE_ID,
    day_of_week: 3,
    start_time: "09:00",
    end_time: "10:00",
    is_available: true
  },
  {
    space_id: SPACE_ID,
    day_of_week: 3,
    start_time: "10:00",
    end_time: "11:00",
    is_available: true
  },
  {
    space_id: SPACE_ID,
    day_of_week: 3,
    start_time: "11:00",
    end_time: "12:00",
    is_available: true
  },
  {
    space_id: SPACE_ID,
    day_of_week: 3,
    start_time: "14:00",
    end_time: "15:00",
    is_available: true
  },
  {
    space_id: SPACE_ID,
    day_of_week: 3,
    start_time: "15:00",
    end_time: "16:00",
    is_available: true
  },
  {
    space_id: SPACE_ID,
    day_of_week: 3,
    start_time: "16:00",
    end_time: "17:00",
    is_available: true
  },
  // Jeudi
  {
    space_id: SPACE_ID,
    day_of_week: 4,
    start_time: "09:00",
    end_time: "10:00",
    is_available: true
  },
  {
    space_id: SPACE_ID,
    day_of_week: 4,
    start_time: "10:00",
    end_time: "11:00",
    is_available: true
  },
  {
    space_id: SPACE_ID,
    day_of_week: 4,
    start_time: "11:00",
    end_time: "12:00",
    is_available: true
  },
  {
    space_id: SPACE_ID,
    day_of_week: 4,
    start_time: "14:00",
    end_time: "15:00",
    is_available: true
  },
  {
    space_id: SPACE_ID,
    day_of_week: 4,
    start_time: "15:00",
    end_time: "16:00",
    is_available: true
  },
  {
    space_id: SPACE_ID,
    day_of_week: 4,
    start_time: "16:00",
    end_time: "17:00",
    is_available: true
  },
  // Vendredi
  {
    space_id: SPACE_ID,
    day_of_week: 5,
    start_time: "09:00",
    end_time: "10:00",
    is_available: true
  },
  {
    space_id: SPACE_ID,
    day_of_week: 5,
    start_time: "10:00",
    end_time: "11:00",
    is_available: true
  },
  {
    space_id: SPACE_ID,
    day_of_week: 5,
    start_time: "11:00",
    end_time: "12:00",
    is_available: true
  },
  {
    space_id: SPACE_ID,
    day_of_week: 5,
    start_time: "14:00",
    end_time: "15:00",
    is_available: true
  },
  {
    space_id: SPACE_ID,
    day_of_week: 5,
    start_time: "15:00",
    end_time: "16:00",
    is_available: true
  },
  {
    space_id: SPACE_ID,
    day_of_week: 5,
    start_time: "16:00",
    end_time: "17:00",
    is_available: true
  }
];

async function insertDefaultTimeSlots() {
  try {
    const { data, error } = await supabase
      .from("time_slots")
      .insert(DEFAULT_TIME_SLOTS)
      .select();

    if (error) {
      logger.error("Erreur lors de l'insertion des créneaux:", error);
      return;
    }

    logger.debug("Créneaux horaires insérés avec succès:", data);
  } catch (err) {
    logger.error("Erreur inattendue:", err);
  }
}

// Exécuter le script
insertDefaultTimeSlots(); 