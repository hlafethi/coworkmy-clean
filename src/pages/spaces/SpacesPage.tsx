import { useNavigate } from "react-router-dom";
import Navbar from "@/components/common/Navbar";
import Footer from "@/components/common/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { useSpaces } from '@/hooks/useSpacesAPI';

const displayPrice = (space: any) => {

  // Logique de prix améliorée - vérifier le pricing_type d'abord
  let price = 0;
  let label = "Prix";
  let unit = "€ TTC";

  if (space.pricing_type) {
    switch (space.pricing_type) {
      case 'hourly':
        price = parseFloat(space.hourly_price) || 0;
        label = "Prix horaire";
        break;
      case 'daily':
        price = parseFloat(space.daily_price) || 0;
        label = "Prix journalier";
        break;
      case 'monthly':
        price = parseFloat(space.monthly_price) || 0;
        label = "Prix mensuel";
        break;
      case 'yearly':
        price = parseFloat(space.yearly_price) || 0;
        label = "Prix annuel";
        break;
      case 'half_day':
        price = parseFloat(space.half_day_price) || 0;
        label = "Prix demi-journée";
        break;
      case 'quarter':
        price = parseFloat(space.quarter_price) || 0;
        label = "Prix quart de journée";
        break;
      case 'custom':
        price = parseFloat(space.custom_price) || 0;
        label = space.custom_label || "Prix personnalisé";
        break;
      default:
        // Fallback: essayer de trouver le premier prix disponible
        price = parseFloat(space.monthly_price) || parseFloat(space.daily_price) || parseFloat(space.hourly_price) || 0;
        label = space.monthly_price ? "Prix mensuel" : 
                space.daily_price ? "Prix journalier" : 
                space.hourly_price ? "Prix horaire" : "Prix";
    }
  } else {
    // Fallback si pas de pricing_type
    price = parseFloat(space.monthly_price) || parseFloat(space.daily_price) || parseFloat(space.hourly_price) || 0;
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

const SpacesPage = () => {
  const { spaces, loading, error } = useSpaces();
  const navigate = useNavigate();

  const handleBooking = (spaceId: string) => {
    navigate(`/booking/${spaceId}`);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Nos espaces</h1>
          <p className="text-gray-600">Découvrez tous nos espaces disponibles à la réservation</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-48 bg-gray-200"></div>
                <CardHeader>
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-20 bg-gray-200 rounded mb-4"></div>
                  <div className="flex justify-between">
                    <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                  </div>
                </CardContent>
                <CardFooter>
                  <div className="h-10 bg-gray-200 rounded w-full"></div>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : error ? (
          <div className="bg-red-50 p-8 rounded-lg text-center">
            <p className="text-red-600 mb-4">Erreur lors du chargement des espaces: {error}</p>
            <Button onClick={() => window.location.reload()}>
              Réessayer
            </Button>
          </div>
        ) : spaces.length === 0 ? (
          <div className="bg-gray-50 p-8 rounded-lg text-center">
            <p className="text-gray-600 mb-4">Aucun espace disponible pour le moment.</p>
            <Button onClick={() => navigate("/dashboard")}>
              Retour au tableau de bord
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {spaces.map((space) => (
              <Card key={space.id} className="overflow-hidden flex flex-col h-full">
                <AspectRatio ratio={16/9} className="bg-gray-100">
                  {space.image_url ? (
                    <img
                      src={space.image_url}
                      alt={space.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-400">Image non disponible</span>
                    </div>
                  )}
                </AspectRatio>
                <CardHeader>
                  <CardTitle>{space.name}</CardTitle>
                  <CardDescription>Capacité: {space.capacity} personnes</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-gray-600 mb-4">{space.description || "Aucune description disponible"}</p>
                  <div className="flex flex-col items-center">
                    {(() => {
                      const priceInfo = displayPrice(space);
                      return (
                        <div className="text-center bg-gray-50 p-4 rounded-lg border border-gray-200">
                          <p className="text-sm font-medium text-gray-500 mb-2">{priceInfo.label}</p>
                          <p className="text-xl font-semibold text-gray-900">{priceInfo.price} {priceInfo.unit}</p>
                        </div>
                      );
                    })()}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full" 
                    onClick={() => handleBooking(space.id)}
                  >
                    Réserver
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default SpacesPage;
