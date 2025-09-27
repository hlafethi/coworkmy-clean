import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/common/Navbar";
import Footer from "@/components/common/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { formatPrice, getSpacePrice, getPricingLabel } from '@/utils/bookingUtils';
import { Space, PricingType } from '@/components/admin/spaces/types';

const displayPrice = (space: Space) => {
  const prices = getSpacePrice(space);
  const unit = getPricingLabel(space);

  let label;
  switch (space.pricing_type) {
    case 'hourly':
      label = "Prix horaire";
      break;
    case 'daily':
      label = "Prix journalier";
      break;
    case 'monthly':
      label = "Prix mensuel";
      break;
    case 'yearly':
      label = "Prix annuel";
      break;
    case 'half_day':
      label = "Prix demi-journée";
      break;
    case 'quarter':
      label = "Prix trimestriel";
      break;
    case 'custom':
      label = space.custom_label || "Prix personnalisé";
      break;
    default:
      label = "Prix horaire";
  }

  return {
    label,
    priceHT: formatPrice(prices.ht),
    priceTTC: formatPrice(prices.ttc),
    unit
  };
};

const SpacesPage = () => {
  const [loading, setLoading] = useState(true);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSpaces = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("spaces")
          .select("*")
          .eq("is_active", true);

        if (error) {
          throw error;
        }

        // Validate and transform data
        const validPricingTypes = ['hourly', 'daily', 'monthly', 'yearly', 'half_day', 'quarter', 'custom'] as PricingType[];
        const validatedSpaces = (data || []).map(space => {
          // Ensure pricing_type is valid, default to 'hourly' if not
          const pricing_type = validPricingTypes.includes(space.pricing_type as PricingType) 
            ? space.pricing_type
            : 'hourly' as PricingType;

          return {
            ...space,
            pricing_type,
            is_active: true
          } as Space;
        });

        setSpaces(validatedSpaces);
      } catch (error) {
        console.error("Erreur lors de la récupération des espaces:", error);
        toast.error("Une erreur s'est produite lors du chargement des espaces");
      } finally {
        setLoading(false);
      }
    };

    fetchSpaces();
  }, []);

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
                        <div className="text-center">
                          <p className="text-sm font-medium text-gray-500 mb-2">{priceInfo.label}</p>
                          <p className="text-sm text-gray-600">HT: <span className="font-semibold">{priceInfo.priceHT} {priceInfo.unit}</span></p>
                          <p className="text-base text-gray-900">TTC: <span className="font-semibold">{priceInfo.priceTTC} {priceInfo.unit}</span></p>
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
