import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { apiClient } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";

interface Space {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
  pricing_type: string;
  hourly_price: number;
  daily_price: number;
  monthly_price: number;
  half_day_price: number;
  quarter_price: number;
  yearly_price: number;
  custom_price: number;
  custom_label: string | null;
}

const Services = () => {
  // Fonction pour formater les tarifs
  const formatPrice = (space: Space) => {
    const prices = {
      hourly: space.hourly_price,
      daily: space.daily_price,
      monthly: space.monthly_price,
      halfDay: space.half_day_price,
      quarter: space.quarter_price,
      yearly: space.yearly_price,
      custom: space.custom_price
    };

    // Trouver le prix non-nul le plus bas
    const nonZeroPrices = Object.entries(prices)
      .filter(([_, price]) => price && price > 0)
      .map(([type, price]) => ({ type, price: Number(price) }))
      .sort((a, b) => a.price - b.price);

    if (nonZeroPrices.length === 0) return 'Prix sur demande';

    const lowestPrice = nonZeroPrices[0];
    
    // Formater le prix selon le type
    switch (lowestPrice.type) {
      case 'hourly':
        return `À partir de ${lowestPrice.price}€/h`;
      case 'daily':
        return `À partir de ${lowestPrice.price}€/jour`;
      case 'monthly':
        return `À partir de ${lowestPrice.price}€/mois`;
      case 'halfDay':
        return `À partir de ${lowestPrice.price}€/demi-journée`;
      case 'quarter':
        return `À partir de ${lowestPrice.price}€/trimestre`;
      case 'yearly':
        return `À partir de ${lowestPrice.price}€/an`;
      case 'custom':
        return space.custom_label || `À partir de ${lowestPrice.price}€`;
      default:
        return `À partir de ${lowestPrice.price}€`;
    }
  };

  const { data: spaces, isLoading } = useQuery({
    queryKey: ["available-spaces"],
    queryFn: async () => {
      console.log('🔄 Chargement des espaces...');
      
      const response = await apiClient.get('/spaces/active');
      
      if (!response.success) {
        console.error('❌ Erreur chargement espaces:', response.error);
        throw new Error(response.error || 'Erreur lors du chargement des espaces');
      }
      
      // Les espaces sont déjà filtrés (actifs uniquement)
      const activeSpaces = response.data.filter((space: Space) => space.is_active);
      console.log('✅ Espaces chargés:', activeSpaces);
      return activeSpaces as Space[];
    },
  });

  return (
    <section id="services" className="section bg-gray-50">
      <div className="container-custom">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="heading-2 text-gray-900 mb-4">
            Réservez votre <span className="text-primary">espace de travail</span>
          </h2>
          <p className="text-gray-600 text-lg">
            Choisissez l'espace qui correspond le mieux à vos besoins professionnels.
            Tous nos espaces sont conçus pour maximiser confort et productivité.
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[...Array(4)].map((_, index) => (
              <Card key={index} className="animate-pulse">
                <AspectRatio ratio={16 / 9}>
                  <div className="w-full h-full bg-gray-200" />
                </AspectRatio>
                <CardHeader>
                  <div className="h-4 w-3/4 bg-gray-200 rounded" />
                  <div className="h-3 w-1/2 bg-gray-200 rounded mt-2" />
                </CardHeader>
                <CardContent>
                  <div className="h-16 bg-gray-200 rounded" />
                </CardContent>
                <CardFooter>
                  <div className="h-10 w-full bg-gray-200 rounded" />
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : spaces?.length === 0 ? (
          <div className="text-center text-gray-600">
            <p>Aucun espace disponible pour le moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {spaces?.map((space) => (
              <Card key={space.id} className="flex flex-col overflow-hidden">
                <AspectRatio ratio={16 / 9}>
                  {space.image_url ? (
                    <img
                      src={space.image_url}
                      alt={space.name}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                      <p className="text-gray-400">Image non disponible</p>
                    </div>
                  )}
                </AspectRatio>
                <CardHeader>
                  <CardTitle>{space.name}</CardTitle>
                  <CardDescription>{space.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary mb-2">
                      {formatPrice(space)}
                    </div>
                    <div className="text-sm text-gray-600">
                      {space.pricing_type === 'hourly' && 'Tarif horaire'}
                      {space.pricing_type === 'daily' && 'Tarif journalier'}
                      {space.pricing_type === 'monthly' && 'Tarif mensuel'}
                      {space.pricing_type === 'half_day' && 'Tarif demi-journée'}
                      {space.pricing_type === 'quarter' && 'Tarif trimestriel'}
                      {space.pricing_type === 'yearly' && 'Tarif annuel'}
                      {space.pricing_type === 'custom' && 'Tarif personnalisé'}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="mt-auto">
                  <Button className="w-full" asChild>
                    <Link to={`/booking/${space.id}`}>Réserver</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default Services;
