import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from "uuid";

const DEFAULT_TIME_SLOTS = [
  { 
    start_time: '09:00', 
    end_time: '10:00', 
    is_available: true,
    display_order: 1,
    label: '09:00 - 10:00'
  },
  { 
    start_time: '10:00', 
    end_time: '11:00', 
    is_available: true,
    display_order: 2,
    label: '10:00 - 11:00'
  },
  { 
    start_time: '11:00', 
    end_time: '12:00', 
    is_available: true,
    display_order: 3,
    label: '11:00 - 12:00'
  },
  { 
    start_time: '14:00', 
    end_time: '15:00', 
    is_available: true,
    display_order: 4,
    label: '14:00 - 15:00'
  },
  { 
    start_time: '15:00', 
    end_time: '16:00', 
    is_available: true,
    display_order: 5,
    label: '15:00 - 16:00'
  },
  { 
    start_time: '16:00', 
    end_time: '17:00', 
    is_available: true,
    display_order: 6,
    label: '16:00 - 17:00'
  }
];

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 seconde

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const initializeTimeSlots = async (spaceId: string) => {
  let retryCount = 0;

  while (retryCount < MAX_RETRIES) {
    try {
      // Supprimer les anciens créneaux de l'espace
      const { error: deleteError } = await supabase
        .from('time_slots')
        .delete()
        .eq('space_id', spaceId);

      if (deleteError) {
        if (deleteError.message?.includes('Failed to fetch') || deleteError.message?.includes('ERR_INSUFFICIENT_RESOURCES')) {
          throw deleteError;
        }
        console.error('❌ Erreur lors de la suppression:', deleteError);
      }

      // Insérer les nouveaux créneaux avec display_order réinitialisé
      const { error: insertError } = await supabase
        .from('time_slots')
        .insert(
          DEFAULT_TIME_SLOTS.map((slot, index) => ({
            ...slot,
            space_id: spaceId,
            display_order: index + 1,
            updated_at: new Date().toISOString()
          }))
        )
        .select();

      if (insertError) {
        if (insertError.code === '23505') {
          // Violation de contrainte unique, on attend un peu et on réessaie
          await sleep(RETRY_DELAY);
          retryCount++;
          continue;
        }
        throw insertError;
      }

      console.log('✅ Créneaux horaires initialisés avec succès');
      return;

    } catch (error: any) {
      console.error('❌ Erreur initialisation:', error);

      if (error.message?.includes('Failed to fetch') || error.message?.includes('ERR_INSUFFICIENT_RESOURCES')) {
        retryCount++;
        if (retryCount < MAX_RETRIES) {
          console.log(`Tentative ${retryCount}/${MAX_RETRIES}...`);
          await sleep(RETRY_DELAY * retryCount);
          continue;
        }
      }

      throw error;
    }
  }

  throw new Error(`Échec après ${MAX_RETRIES} tentatives`);
};

// Duplique les créneaux horaires d'un espace sur tous les jours ouvrés (1=lundi à 5=vendredi)
export const duplicateTimeSlotsForWeek = async (spaceId: string) => {
  try {
    // Récupérer les créneaux du lundi (jour 1)
    const { data: mondaySlots } = await supabase
      .from('time_slots')
      .select('*')
      .eq('space_id', spaceId)
      .eq('day_of_week', 1);

    if (!mondaySlots?.length) {
      console.log('Aucun créneau à dupliquer pour le lundi');
      return;
    }

    // Générer les créneaux pour mardi (2) à vendredi (5)
    const slotsToInsert: any[] = [];
    for (let day = 2; day <= 5; day++) {
      mondaySlots.forEach(slot => {
        slotsToInsert.push({
          ...slot,
          id: uuidv4(), // Nouvel ID unique
          day_of_week: day,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      });
    }

    // Insertion en batch
    const { error } = await supabase
      .from('time_slots')
      .insert(slotsToInsert);

    if (error) throw error;

    console.log(`✅ ${slotsToInsert.length} créneaux dupliqués pour la semaine`);

  } catch (error) {
    console.error('Erreur duplication:', error);
    throw error;
  }
};

// Fonction SQL à créer côté Supabase (fonction RPC)
// CREATE OR REPLACE FUNCTION reorder_time_slots(p_space_id uuid)
// RETURNS void AS $$
// BEGIN
//   WITH ordered AS (
//     SELECT id, ROW_NUMBER() OVER (ORDER BY display_order, id) AS new_order
//     FROM time_slots WHERE space_id = p_space_id
//   )
//   UPDATE time_slots t
//   SET display_order = o.new_order
//   FROM ordered o
//   WHERE t.id = o.id AND t.display_order <> o.new_order;
// END;
// $$ LANGUAGE plpgsql; 