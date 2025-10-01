import { useHomepageSettings } from '@/hooks/useHomepageSettings';

export default function TestHomepage() {
  const { settings, loading } = useHomepageSettings();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg">Chargement des paramètres...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-8">
          Test de la Homepage avec les informations de l'entreprise
        </h1>
        
        {/* Section Hero */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Section Hero</h2>
          <div className="space-y-4">
            <p><strong>Titre:</strong> {settings?.hero_title || 'Non défini'}</p>
            <p><strong>Sous-titre:</strong> {settings?.hero_subtitle || 'Non défini'}</p>
            {settings?.hero_background_image && (
              <div>
                <p><strong>Image de fond:</strong></p>
                <img 
                  src={settings.hero_background_image} 
                  alt="Image de fond" 
                  className="w-full h-48 object-cover rounded-lg"
                />
              </div>
            )}
          </div>
        </div>

        {/* Informations de l'entreprise */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Informations de l'entreprise</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p><strong>Nom:</strong> {settings?.company_name || 'Non défini'}</p>
              <p><strong>Email:</strong> {settings?.company_email || 'Non défini'}</p>
              <p><strong>Téléphone:</strong> {settings?.company_phone || 'Non défini'}</p>
              <p><strong>Site web:</strong> {settings?.company_website || 'Non défini'}</p>
            </div>
            <div>
              <p><strong>Adresse:</strong></p>
              <p className="whitespace-pre-line">{settings?.company_address || 'Non définie'}</p>
              <p><strong>SIRET:</strong> {settings?.company_siret || 'Non défini'}</p>
              <p><strong>TVA:</strong> {settings?.company_vat_number || 'Non défini'}</p>
            </div>
          </div>
          
          {settings?.company_logo_url && (
            <div className="mt-4">
              <p><strong>Logo de l'entreprise:</strong></p>
              <img 
                src={settings.company_logo_url} 
                alt="Logo de l'entreprise" 
                className="h-24 w-auto object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}
          
          {settings?.company_description && (
            <div className="mt-4">
              <p><strong>Description:</strong></p>
              <p className="text-gray-600">{settings.company_description}</p>
            </div>
          )}
        </div>

        {/* Informations utilisateur */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Informations utilisateur</h2>
          <div className="space-y-2">
            <p><strong>Nom:</strong> {settings?.user_name || 'Non défini'}</p>
            <p><strong>Entreprise:</strong> {settings?.user_company || 'Non définie'}</p>
            <p><strong>Ville:</strong> {settings?.user_city || 'Non définie'}</p>
            <p><strong>Présentation:</strong> {settings?.user_presentation || 'Non définie'}</p>
            {settings?.user_avatar && (
              <div>
                <p><strong>Avatar:</strong></p>
                <img 
                  src={settings.user_avatar} 
                  alt="Avatar utilisateur" 
                  className="h-16 w-16 rounded-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Données brutes pour debug */}
        <div className="bg-gray-100 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Données brutes (debug)</h2>
          <pre className="bg-gray-200 p-4 rounded text-sm overflow-auto max-h-96">
            {JSON.stringify(settings, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
