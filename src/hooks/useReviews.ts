import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/context/AuthContextPostgreSQL';

interface Review {
  id: string;
  space_id: string;
  user_id: string;
  rating: number;
  comment: string;
  created_at: string;
  updated_at: string;
}

export const useReviews = (spaceId?: string) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        // Pour PostgreSQL, on utilise des données par défaut pour l'instant
        setReviews([]);
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