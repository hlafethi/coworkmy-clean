import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Review } from '@/types/database.types';
import { useAuth } from '@/hooks/useAuth';

export const useReviews = (spaceId?: string) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        let query = supabase
          .from('reviews')
          .select('*')
          .order('created_at', { ascending: false });

        if (spaceId) {
          query = query.eq('space_id', spaceId);
        }

        const { data, error } = await query;

        if (error) throw error;
        setReviews(data || []);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Une erreur est survenue'));
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();

    // Abonnement en temps réel aux nouveaux avis
    const subscription = supabase
      .channel('reviews')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reviews',
          filter: spaceId ? `space_id=eq.${spaceId}` : undefined,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setReviews((prev) => [payload.new as Review, ...prev]);
          } else if (payload.eventType === 'DELETE') {
            setReviews((prev) => prev.filter((review) => review.id !== payload.old.id));
          } else if (payload.eventType === 'UPDATE') {
            setReviews((prev) =>
              prev.map((review) =>
                review.id === payload.new.id ? (payload.new as Review) : review
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [spaceId]);

  const addReview = async (spaceId: string, rating: number, comment?: string) => {
    try {
      const { data, error } = await supabase.from('reviews').insert({
        space_id: spaceId,
        user_id: user?.id,
        rating,
        comment,
      }).select().single();

      if (error) throw error;
      return data;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Une erreur est survenue'));
      return null;
    }
  };

  const updateReview = async (reviewId: string, rating: number, comment?: string) => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .update({ rating, comment })
        .eq('id', reviewId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Une erreur est survenue'));
      return null;
    }
  };

  const deleteReview = async (reviewId: string) => {
    try {
      const { error } = await supabase.from('reviews').delete().eq('id', reviewId);

      if (error) throw error;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Une erreur est survenue'));
    }
  };

  return {
    reviews,
    loading,
    error,
    addReview,
    updateReview,
    deleteReview,
  };
}; 