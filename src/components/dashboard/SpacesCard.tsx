
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export const SpacesCard = () => {
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Espaces disponibles</CardTitle>
        <CardDescription>Consultez nos différents espaces de coworking</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center">
          <p className="mb-4">Découvrez nos espaces et leurs disponibilités</p>
          <Button 
            onClick={() => navigate("/spaces")}
            className="w-full md:w-auto"
          >
            Voir les espaces
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
