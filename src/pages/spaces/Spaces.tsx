import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/common/Navbar";
import Footer from "@/components/common/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import type { Space } from "@/components/admin/types";

const Spaces = () => {
  const [loading, setLoading] = useState(true);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSpaces = async () => {
      try {
        const { data, error } = await supabase
          .from("spaces")
          .select("*")
          .eq("is_active", true);

        if (error) {
          throw error;
        }

        setSpaces(data || []);
      } catch (error) {
        console.error("Erreur lors de la récupération des espaces:", error);
        toast.error("Une erreur s'est produite lors du chargement des espaces");
      } finally {
        setLoading(false);
      }
    };

    fetchSpaces();
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow container-custom py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Nos espaces</h1>
          <p className="text-gray-600">Découvrez tous nos espaces disponibles à la réservation</p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <p className="text-xl">Chargement des espaces...</p>
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
                <div className="h-48 overflow-hidden">
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
                </div>
                <CardHeader>
                  <CardTitle>{space.name}</CardTitle>
                  <CardDescription>Capacité: {space.capacity} personnes</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-gray-600 mb-4">{space.description || "Aucune description disponible"}</p>
                  <div className="flex justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Prix horaire</p>
                      <p className="text-lg font-semibold">{space.hourly_price} €</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Prix journalier</p>
                      <p className="text-lg font-semibold">{space.daily_price} €</p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full bg-primary hover:bg-teal-800" onClick={() => navigate(`/booking/${space.id}`)}>
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

export default Spaces;
