import { useHomepageSettings } from '@/hooks/useHomepageSettings';

export default function CompanyInfo() {
  const { settings, loading } = useHomepageSettings();

  if (loading) {
    return (
      <div className="bg-white py-16">
        <div className="container mx-auto px-4">
          <div className="text-center">Chargement des informations de l'entreprise...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            À propos de {settings?.company_name || 'notre entreprise'}
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {settings?.company_description || 'Découvrez notre entreprise et nos valeurs'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Logo de l'entreprise */}
          {settings?.company_logo_url && (
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-4">Notre logo</h3>
              <img 
                src={settings.company_logo_url} 
                alt={settings.company_name || 'Logo'} 
                className="h-24 w-auto object-contain mx-auto"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}

          {/* Informations de contact */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Contact</h3>
            <div className="space-y-2 text-gray-600">
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
              {settings?.company_website && (
                <p>
                  <span className="font-medium">Site web:</span>{' '}
                  <a 
                    href={settings.company_website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    {settings.company_website}
                  </a>
                </p>
              )}
            </div>
          </div>

          {/* Adresse */}
          {settings?.company_address && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Adresse</h3>
              <div className="text-gray-600">
                <p className="whitespace-pre-line">{settings.company_address}</p>
              </div>
            </div>
          )}
        </div>

        {/* Informations légales */}
        {(settings?.company_siret || settings?.company_vat_number) && (
          <div className="mt-12 pt-8 border-t border-gray-200">
            <div className="text-center text-sm text-gray-500">
              {settings?.company_siret && (
                <p>SIRET: {settings.company_siret}</p>
              )}
              {settings?.company_vat_number && (
                <p>TVA: {settings.company_vat_number}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
