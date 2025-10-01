import { useHomepageSettings } from '@/hooks/useHomepageSettings';
import { useLegalPages } from '@/hooks/useLegalPages';
import { Link } from 'react-router-dom';

export default function Footer() {
  const { settings, loading } = useHomepageSettings();
  const { pages, loading: legalLoading } = useLegalPages();

  if (loading) {
    return (
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="text-center">Chargement...</div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="bg-gray-900 text-white py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo et description de l'entreprise */}
          <div className="space-y-4">
            {settings?.company_logo_url && (
              <img 
                src={settings.company_logo_url} 
                alt={settings.company_name || 'Logo'} 
                className="h-12 w-auto object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            )}
            <h3 className="text-xl font-bold">
              {settings?.company_name || 'Votre Entreprise'}
            </h3>
            <p className="text-gray-300">
              {settings?.company_description || 'Description de votre entreprise'}
            </p>
          </div>

          {/* Informations de contact */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Contact</h4>
            <div className="space-y-2 text-gray-300">
              {settings?.company_email && (
                <p>
                  <span className="font-medium">Email:</span> {settings.company_email}
                </p>
              )}
              {settings?.company_phone && (
                <p>
                  <span className="font-medium">Téléphone:</span> {settings.company_phone}
                </p>
              )}
              {settings?.company_address && (
                <p>
                  <span className="font-medium">Adresse:</span>
                  <br />
                  <span className="whitespace-pre-line">{settings.company_address}</span>
                </p>
              )}
            </div>
          </div>

          {/* Liens et informations légales */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Informations</h4>
            <div className="space-y-2 text-gray-300">
              {settings?.company_website && (
                <p>
                  <a 
                    href={settings.company_website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300"
                  >
                    {settings.company_website}
                  </a>
                </p>
              )}
              {settings?.company_siret && (
                <p>
                  <span className="font-medium">SIRET:</span> {settings.company_siret}
                </p>
              )}
              {settings?.company_vat_number && (
                <p>
                  <span className="font-medium">TVA:</span> {settings.company_vat_number}
                </p>
              )}
            </div>
          </div>

          {/* Pages légales */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Pages légales</h4>
            <div className="space-y-2 text-gray-300">
              {!legalLoading && pages && pages.length > 0 ? (
                pages
                  .filter(page => page.is_active)
                  .map((page) => (
                    <p key={page.id}>
                      <Link 
                        to={`/legal/${page.type}`}
                        className="text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        {page.title}
                      </Link>
                    </p>
                  ))
              ) : (
                <div className="space-y-2">
                  <p>
                    <Link 
                      to="/legal/legal"
                      className="text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      Mentions légales
                    </Link>
                  </p>
                  <p>
                    <Link 
                      to="/legal/terms"
                      className="text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      Conditions générales
                    </Link>
                  </p>
                  <p>
                    <Link 
                      to="/legal/privacy"
                      className="text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      Politique de confidentialité
                    </Link>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; 2024 {settings?.company_name || 'Votre Entreprise'}. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
}