import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { CreditCard, TestTube, Zap } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { logger } from '@/utils/logger';

interface StripeConfig {
  mode?: 'test' | 'live';
}

export const StripeModeIndicator = () => {
  const [mode, setMode] = useState<'test' | 'live' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStripeMode = async () => {
      try {
        // Mode par défaut en test pour PostgreSQL
        setMode('test');
      } catch (error) {
        logger.error("Erreur lors de la récupération du mode Stripe:", error);
        setMode('test'); // Fallback en mode test
      } finally {
        setLoading(false);
      }
    };

    fetchStripeMode();
  }, []);

  if (loading) {
    return (
      <Badge variant="outline" className="animate-pulse">
        <CreditCard className="h-3 w-3 mr-1" />
        Chargement...
      </Badge>
    );
  }

  if (mode === 'live') {
    return (
      <Badge variant="default" className="bg-green-600 hover:bg-green-700">
        <Zap className="h-3 w-3 mr-1" />
        PRODUCTION
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className="bg-orange-100 text-orange-800 hover:bg-orange-200">
      <TestTube className="h-3 w-3 mr-1" />
      TEST
    </Badge>
  );
}; 