// Ce fichier est déprécié, utilisez plutôt src/lib/supabase.ts
import { supabase } from '@/lib/supabase';

// Expose le client Supabase globalement pour debug
if (typeof window !== 'undefined') {
  // @ts-ignore
  window.supabase = supabase;
}

export { supabase };
