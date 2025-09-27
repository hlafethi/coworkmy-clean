import React, { useState } from 'react';
import { useReviews } from '@/hooks/useReviews';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ReviewSectionProps {
    spaceId: string;
}

export const ReviewSection: React.FC<ReviewSectionProps> = ({ spaceId }) => {
    const { reviews, addReview, updateReview, deleteReview } = useReviews(spaceId);
    const { user } = useAuth();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [editingReviewId, setEditingReviewId] = useState<string | null>(null);

    const userReview = reviews.find((review) => review.user_id === user?.id);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            toast({
                title: 'Erreur',
                description: 'Vous devez être connecté pour laisser un avis',
                variant: 'destructive',
            });
            return;
        }

        setIsSubmitting(true);
        try {
            if (editingReviewId) {
                await updateReview(editingReviewId, rating, comment);
                toast({
                    title: 'Succès',
                    description: 'Votre avis a été mis à jour',
                });
            } else {
                await addReview(spaceId, rating, comment);
                toast({
                    title: 'Succès',
                    description: 'Votre avis a été publié',
                });
            }
            setRating(0);
            setComment('');
            setEditingReviewId(null);
        } catch (err) {
            toast({
                title: 'Erreur',
                description: 'Une erreur est survenue lors de la publication de votre avis',
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (review: typeof userReview) => {
        if (review) {
            setRating(review.rating);
            setComment(review.comment || '');
            setEditingReviewId(review.id);
        }
    };

    const handleDelete = async () => {
        if (!userReview) return;
        try {
            await deleteReview(userReview.id);
            toast({
                title: 'Succès',
                description: 'Votre avis a été supprimé',
            });
            setRating(0);
            setComment('');
            setEditingReviewId(null);
        } catch (err) {
            toast({
                title: 'Erreur',
                description: 'Une erreur est survenue lors de la suppression de votre avis',
                variant: 'destructive',
            });
        }
    };

    const averageRating =
        reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length || 0;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                            key={star}
                            className={`h-5 w-5 ${star <= averageRating
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-300'
                                }`}
                        />
                    ))}
                </div>
                <span className="text-sm text-muted-foreground">
                    {reviews.length} avis
                </span>
            </div>

            {user && !userReview && (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                onClick={() => setRating(star)}
                                className="focus:outline-none"
                            >
                                <Star
                                    className={`h-6 w-6 ${star <= rating
                                            ? 'fill-yellow-400 text-yellow-400'
                                            : 'text-gray-300'
                                        }`}
                                />
                            </button>
                        ))}
                    </div>
                    <Textarea
                        placeholder="Partagez votre expérience..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        className="min-h-[100px]"
                    />
                    <Button type="submit" disabled={isSubmitting || rating === 0}>
                        {isSubmitting ? 'Publication...' : 'Publier mon avis'}
                    </Button>
                </form>
            )}

            {userReview && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                    key={star}
                                    className={`h-5 w-5 ${star <= userReview.rating
                                            ? 'fill-yellow-400 text-yellow-400'
                                            : 'text-gray-300'
                                        }`}
                                />
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(userReview)}
                            >
                                Modifier
                            </Button>
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={handleDelete}
                            >
                                Supprimer
                            </Button>
                        </div>
                    </div>
                    <p className="text-sm">{userReview.comment}</p>
                </div>
            )}

            <div className="space-y-4">
                {reviews
                    .filter((review) => review.user_id !== user?.id)
                    .map((review) => (
                        <div key={review.id} className="space-y-2">
                            <div className="flex items-center gap-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                        key={star}
                                        className={`h-4 w-4 ${star <= review.rating
                                                ? 'fill-yellow-400 text-yellow-400'
                                                : 'text-gray-300'
                                            }`}
                                    />
                                ))}
                                <span className="text-xs text-muted-foreground">
                                    {formatDistanceToNow(new Date(review.created_at), {
                                        addSuffix: true,
                                        locale: fr,
                                    })}
                                </span>
                            </div>
                            <p className="text-sm">{review.comment}</p>
                        </div>
                    ))}
            </div>
        </div>
    );
}; 