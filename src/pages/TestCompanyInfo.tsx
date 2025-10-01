import { useHomepageSettings } from '@/hooks/useHomepageSettings';
import CompanyInfo from '@/components/homepage/CompanyInfo';
import Footer from '@/components/common/Footer';

export default function TestCompanyInfo() {
  const { settings, loading } = useHomepageSettings();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Chargement...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-8">
          Test des informations de l'entreprise
        </h1>
        
        {/* Affichage des données brutes */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Données récupérées :</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(settings, null, 2)}
          </pre>
        </div>

        {/* Composant CompanyInfo */}
        <CompanyInfo />

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
}
