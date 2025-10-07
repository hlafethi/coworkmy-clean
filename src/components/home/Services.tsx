import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { apiClient } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
// Logger supprimé - utilisation de console directement
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
  // Fonction pour formater les tarifs avec calcul TTC
  const formatPrice = (space: Space) => {
    // Logique de prix améliorée - vérifier le pricing_type d'abord
    let price = 0;
    let label = "Prix";
    let unit = "€ TTC";

    if (space.pricing_type) {
      switch (space.pricing_type) {
        case 'hourly':
          price = parseFloat(space.hourly_price.toString()) || 0;
          label = "Prix horaire";
          break;
        case 'daily':
          price = parseFloat(space.daily_price.toString()) || 0;
          label = "Prix journalier";
          break;
        case 'monthly':
          price = parseFloat(space.monthly_price.toString()) || 0;
          label = "Prix mensuel";
          break;
        case 'yearly':
          price = parseFloat(space.yearly_price.toString()) || 0;
          label = "Prix annuel";
          break;
        case 'half_day':
          price = parseFloat(space.half_day_price.toString()) || 0;
          label = "Prix demi-journée";
          break;
        case 'quarter':
          price = parseFloat(space.quarter_price.toString()) || 0;
          label = "Prix trimestriel";
          break;
        case 'custom':
          price = parseFloat(space.custom_price.toString()) || 0;
          label = space.custom_label || "Prix personnalisé";
          break;
        default:
          // Fallback: essayer de trouver le premier prix disponible
          price = parseFloat(space.monthly_price.toString()) || parseFloat(space.daily_price.toString()) || parseFloat(space.hourly_price.toString()) || 0;
          label = space.monthly_price ? "Prix mensuel" : 
                  space.daily_price ? "Prix journalier" : 
                  space.hourly_price ? "Prix horaire" : "Prix";
      }
    } else {
      // Fallback si pas de pricing_type
      price = parseFloat(space.monthly_price.toString()) || parseFloat(space.daily_price.toString()) || parseFloat(space.hourly_price.toString()) || 0;
      label = space.monthly_price ? "Prix mensuel" : 
              space.daily_price ? "Prix journalier" : 
              space.hourly_price ? "Prix horaire" : "Prix";
    }
    
    // Calculer le prix TTC (les prix en base sont HT, donc on multiplie par 1.2)
    const priceTTC = typeof price === 'number' ? price * 1.2 : 0;
    
    return {
      label,
      price: priceTTC.toFixed(2),
      unit
    };
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
        <div className="text-center max-w-4xl mx-auto mb-20">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Réservez votre <span className="text-primary">espace de travail</span>
          </h2>
          <p className="text-gray-600 text-xl leading-relaxed">
            Choisissez l'espace qui correspond le mieux à vos besoins professionnels.
            Tous nos espaces sont conçus pour maximiser confort et productivité.
          </p>
          <div className="mt-8 flex justify-center">
            <div className="w-24 h-1 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"></div>
          </div>
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
              <Card key={space.id} className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 border-0">
                <AspectRatio ratio={16 / 9} className="relative">
                  {space.image_url ? (
                    <img
                      src={space.image_url}
                      alt={space.name}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                      <p className="text-gray-400">Image non disponible</p>
                    </div>
                  )}
                  {/* Badge de statut */}
                  <div className="absolute top-3 right-3">
                    <div className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium text-gray-700">
                      Disponible
                    </div>
                  </div>
                </AspectRatio>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold text-gray-900">{space.name}</CardTitle>
                  <CardDescription className="text-sm text-gray-600 line-clamp-2">{space.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <div className="text-center">
                    {(() => {
                      const priceInfo = formatPrice(space);
                      return (
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-100">
                          <p className="text-sm font-medium text-green-600 mb-2">{priceInfo.label}</p>
                          <p className="text-2xl font-bold text-green-900 mb-1">{priceInfo.price} {priceInfo.unit}</p>
                          <p className="text-xs text-green-500">TVA 20% incluse</p>
                        </div>
                      );
                    })()}
                  </div>
                </CardContent>
                <CardFooter className="pt-3">
                  <Button className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-2.5 rounded-lg transition-colors duration-200" asChild>
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
