import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2, XCircle, RefreshCw } from "lucide-react";

interface ConnectionTestProps {
  apiKey: string;
  placeId: string;
  onTest: (apiKey: string, placeId: string) => Promise<void>;
  isLoading: boolean;
  placeName: string | null;
}

export function ConnectionTest({ apiKey, placeId, onTest, isLoading, placeName }: ConnectionTestProps) {
  const [error, setError] = useState<string | null>(null);

  const handleTest = async () => {
    if (!apiKey || !placeId) {
      setError("Veuillez remplir tous les champs");
      return;
    }

    setError(null);
    try {
      await onTest(apiKey, placeId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    }
  };

  return (
    <div className="space-y-4">
      <Button
        type="button"
        variant="outline"
        onClick={handleTest}
        disabled={isLoading || !apiKey || !placeId}
        className="w-full"
      >
        {isLoading ? (
          <>
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            Test en cours...
          </>
        ) : (
          "Tester la connexion"
        )}
      </Button>

      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {placeName && !error && (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>Succès</AlertTitle>
          <AlertDescription>
            Connexion établie avec succès pour : <strong>{placeName}</strong>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
