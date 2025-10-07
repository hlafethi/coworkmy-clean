import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import type { CarouselApi } from "@/components/ui/carousel";
// Logger supprimé - utilisation de console directement
interface CarouselImage {
  id: string;
  image_url: string;
  display_order: number;
}

export function WorkspaceCarousel() {
  const carouselRef = useRef<CarouselApi>();
  
  // 🔧 CORRECTION : Charger SEULEMENT les images du carrousel via l'API
  const { data: carouselImages, isLoading } = useQuery({
    queryKey: ["carousel-images"],
    queryFn: async () => {
      console.log('🔄 Chargement des images du carrousel...');
      
      const response = await apiClient.get('/carousel-images');
      
      if (!response.success) {
        console.error('❌ Erreur chargement carrousel:', response.error);
        throw new Error(response.error || 'Erreur lors du chargement des images');
      }
      
      console.log('✅ Images du carrousel chargées:', response.data);
      return response.data as CarouselImage[];
    },
  });

  useEffect(() => {
    if (!carouselImages?.length || !carouselRef.current) return;
    
    const interval = setInterval(() => {
      if (carouselRef.current) {
        carouselRef.current.scrollNext();
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, [carouselImages]);

  if (isLoading) {
    return (
      <div className="w-full max-w-6xl mx-auto h-64 flex items-center justify-center">
        <p className="text-gray-500">Chargement du carrousel...</p>
      </div>
    );
  }

  if (!carouselImages?.length) {
    return (
      <div className="w-full max-w-6xl mx-auto h-64 flex items-center justify-center">
        <p className="text-gray-500">Aucune image dans le carrousel</p>
      </div>
    );
  }

  return (
    <Carousel 
      className="w-full max-w-6xl mx-auto"
      setApi={(api) => {
        carouselRef.current = api;
      }}
      opts={{
        loop: true,
        align: "start",
      }}
    >
      <CarouselContent>
        {carouselImages.map((image) => (
          <CarouselItem key={image.id} className="md:basis-1/2 lg:basis-1/3 pl-4">
            <Card className="h-full flex flex-col overflow-hidden border rounded-lg shadow-md">
              <AspectRatio ratio={4/3} className="bg-gray-100">
                <img
                  src={image.image_url || undefined}
                  alt={`Image du carrousel ${image.display_order}`}
                  className="object-cover w-full h-full"
                  onError={(e) => {
                    console.error('❌ Erreur chargement image:', image.image_url);
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1600508774634-4e11d34730e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80';
                  }}
                />
              </AspectRatio>
            </Card>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="hidden md:flex" />
      <CarouselNext className="hidden md:flex" />
    </Carousel>
  );
}
