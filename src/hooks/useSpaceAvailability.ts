import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Booking } from "@/components/admin/types";
import { withRetry } from "@/utils/supabaseUtils";

export interface SpaceAvailability {
  id: string;
  space_id: string;
  is_available: boolean;
  is_active: boolean;
  last_updated: string;
}

interface AvailabilityResult {
  isAvailable: boolean;
  availableCapacity: number;
  totalCapacity: number;
}

export function useSpaceAvailability(spaceId: string) {
  const [availability, setAvailability] = useState<SpaceAvailability | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (spaceId) {
      fetchAvailability();
    }
  }, [spaceId]);

  const fetchAvailability = async () => {
    try {
      const { data, error } = await supabase
        .from('space_availability')
        .select('*')
        .eq('space_id', spaceId)
        .single();

      if (error) throw error;

      setAvailability({
        id: data.id,
        space_id: data.space_id,
        is_available: data.is_available,
        is_active: data.is_active,
        last_updated: data.last_updated
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const updateAvailability = async (updates: Partial<SpaceAvailability>) => {
    try {
      const { data, error } = await supabase
        .from('space_availability')
        .update(updates)
        .eq('space_id', spaceId)
        .select()
        .single();

      if (error) throw error;

      setAvailability({
        id: data.id,
        space_id: data.space_id,
        is_available: data.is_available,
        is_active: data.is_active,
        last_updated: data.last_updated
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    }
  };

  const checkAvailability = async ({
    startDate,
    endDate,
    spaceId
  }: {
    startDate: Date;
    endDate: Date;
    spaceId: string;
  }): Promise<AvailabilityResult> => {
    try {
      setLoading(true);
      setError(null);

      const result = await withRetry(async () => {
        const { data: bookings, error: bookingsError } = await supabase
          .from('bookings')
          .select('*')
          .eq('space_id', spaceId)
          .or(`start_date.lte.${endDate.toISOString()},end_date.gte.${startDate.toISOString()}`);
        
        if (bookingsError) throw bookingsError;

        const { data: space, error: spaceError } = await supabase
          .from('spaces')
          .select('capacity')
          .eq('id', spaceId)
          .single();

        if (spaceError) throw spaceError;

        const totalCapacity = space.capacity || 1;
        const bookedCapacity = bookings.reduce((sum, booking) => sum + (booking.capacity || 1), 0);
        const availableCapacity = Math.max(0, totalCapacity - bookedCapacity);

        return {
          isAvailable: availableCapacity > 0,
          availableCapacity,
          totalCapacity
        };
      });

      return result;
    } catch (err: any) {
      console.error('❌ Erreur lors de la vérification de disponibilité:', err);
      setError(err.message);
      return {
        isAvailable: false,
        availableCapacity: 0,
        totalCapacity: 1
      };
    } finally {
      setLoading(false);
    }
  };

  const checkAvailabilityForRange = async ({
    startDate,
    endDate,
    spaceId
  }: {
    startDate: Date;
    endDate: Date;
    spaceId: string;
  }): Promise<Booking[]> => {
    try {
      setLoading(true);
      setError(null);

      const result = await withRetry(async () => {
        const { data, error } = await supabase
          .from('bookings')
          .select('*')
          .eq('space_id', spaceId)
          .or(`start_date.lte.${endDate.toISOString()},end_date.gte.${startDate.toISOString()}`);
        
        if (error) throw error;
        return data;
      });

      return result;
    } catch (err: any) {
      console.error('❌ Erreur lors de la vérification de disponibilité:', err);
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  };

  return {
    availability,
    loading,
    error,
    updateAvailability,
    refreshAvailability: fetchAvailability,
    checkAvailability,
    checkAvailabilityForRange
  };
}
