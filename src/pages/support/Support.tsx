import { SupportSystem } from "@/components/common/SupportSystem";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/context/AuthContextPostgreSQL";
import { logger } from '@/utils/logger';

const Support = () => {
  const { user } = useAuth();
  logger.debug('[Support] Rendu - user:', user);

  return (
    <>
      <Helmet>
        <title>Support - CoWorkMy</title>
        <meta name="description" content="Centre d'assistance et support client pour les utilisateurs de CoWorkMy. Trouvez des réponses à vos questions, consultez notre FAQ, créez un ticket ou discutez en direct avec notre équipe." />
      </Helmet>

      <main className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <nav className="mb-6 flex justify-between items-center">
              <Button variant="outline" size="sm" asChild>
                <Link to="/" className="flex items-center gap-2">
                  <ArrowLeft size={16} />
                  Retour à l'accueil
                </Link>
              </Button>

              {user && (
                <Button variant="outline" size="sm" asChild>
                  <Link to="/dashboard">
                    Mon espace
                  </Link>
                </Button>
              )}
            </nav>

            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <header className="p-6 bg-blue-700 text-white">
                <h1 className="text-3xl font-bold">Centre de support</h1>
                <p className="mt-2 text-white">
                  Nous sommes là pour vous aider. Trouvez des réponses à vos questions ou contactez-nous directement.
                </p>
              </header>

              <SupportSystem />
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default Support;
