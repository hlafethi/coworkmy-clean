import { useEffect, useState } from "react";
import { Star, StarHalf, ExternalLink } from "lucide-react";
import { useGoogleReviews } from "@/hooks/useGoogleReviews";
import { Alert } from "@/components/ui/alert";

interface GoogleReview {
  author_name: string;
  rating: number;
  text: string;
  time: number;
  profile_photo_url: string;
}

interface ReviewsData {
  reviews: GoogleReview[];
  place_name?: string;
}

const Testimonials = () => {
  const { data, isLoading, error } = useGoogleReviews();
  const [placeId, setPlaceId] = useState<string>("");

  // Mode par défaut pour PostgreSQL
  useEffect(() => {
    // Pas de place_id par défaut pour PostgreSQL
    setPlaceId("");
  }, []);

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    // Add full stars
    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={`star-${i}`} className="h-4 w-4 fill-yellow-400 text-yellow-400" />);
    }

    // Add half star if needed
    if (hasHalfStar) {
      stars.push(<StarHalf key="half-star" className="h-4 w-4 fill-yellow-400 text-yellow-400" />);
    }

    return stars;
  };

  const formatReviewDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  if (isLoading) {
    return (
      <section className="section bg-gray-50">
        <div className="container-custom">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="heading-2 text-gray-900 mb-4">
              Ce que disent nos <span className="text-primary">membres</span>
            </h2>
            <p className="text-gray-600 text-lg">
              Chargement des témoignages...
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="section bg-gray-50">
        <div className="container-custom">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="heading-2 text-gray-900 mb-4">
              Ce que disent nos <span className="text-primary">membres</span>
            </h2>
            <Alert variant="destructive" className="mt-4">
              <h3 className="text-lg font-bold text-red-700 dark:text-red-300">Impossible de charger les témoignages</h3>
              <div className="text-base mt-2 text-red-700 dark:text-red-300">
                Veuillez réessayer plus tard ou contactez l'administrateur.
              </div>
            </Alert>
          </div>
        </div>
      </section>
    );
  }

  const reviewsData: ReviewsData = {
    reviews: Array.isArray(data) ? data : [],
    place_name: undefined
  };

  if (!reviewsData.reviews || reviewsData.reviews.length === 0) {
    return (
      <section className="section bg-gray-50">
        <div className="container-custom">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="heading-2 text-gray-900 mb-4">
              Ce que disent nos <span className="text-primary">membres</span>
            </h2>
            <p className="text-gray-600 text-lg">
              Découvrez les témoignages de ceux qui ont choisi Co Work My pour leurs besoins professionnels.
            </p>
            <div className="mt-8">
              <p>Aucun témoignage disponible pour le moment.</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="section bg-gray-50">
      <div className="container-custom">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="heading-2 text-gray-900 mb-4">
            Ce que disent nos <span className="text-primary">membres</span>
          </h2>
          <p className="text-gray-600 text-lg">
            Découvrez les témoignages de ceux qui ont choisi Co Work My pour leurs besoins professionnels.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {reviewsData.reviews.map((review, index) => (
            <div
              key={index}
              className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300"
            >
              <div className="mb-6">
                <svg className="h-8 w-8 text-primary opacity-80" fill="currentColor" viewBox="0 0 32 32">
                  <path d="M9.352 4C4.456 7.456 1 13.12 1 19.36c0 5.088 3.072 8.064 6.624 8.064 3.36 0 5.856-2.688 5.856-5.856 0-3.168-2.208-5.472-5.088-5.472-.576 0-1.344.096-1.536.192.48-3.264 3.552-7.104 6.624-9.024L9.352 4zm16.512 0c-4.8 3.456-8.256 9.12-8.256 15.36 0 5.088 3.072 8.064 6.624 8.064 3.264 0 5.856-2.688 5.856-5.856 0-3.168-2.304-5.472-5.184-5.472-.576 0-1.248.096-1.44.192.48-3.264 3.456-7.104 6.528-9.024L25.864 4z" />
                </svg>
              </div>
              <div className="flex items-center mb-4">
                {renderStars(review.rating)}
              </div>
              <p className="text-gray-600 mb-6 italic line-clamp-4">{review.text}</p>
              <div className="flex items-center">
                <img
                  src={review.profile_photo_url}
                  alt={review.author_name}
                  className="w-12 h-12 rounded-full mr-4"
                  onError={(e) => {
                    e.currentTarget.src = "https://randomuser.me/api/portraits/lego/1.jpg";
                  }}
                />
                <div>
                  <p className="font-semibold text-gray-900">{review.author_name}</p>
                  <p className="text-gray-500 text-sm">{formatReviewDate(review.time)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-center mt-12">
          <a
            href={`https://search.google.com/local/reviews?placeid=${placeId || ''}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Voir tous les avis sur Google
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
