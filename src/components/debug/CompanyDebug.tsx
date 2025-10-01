import { useHomepageSettings } from '@/hooks/useHomepageSettings';

export const CompanyDebug = () => {
  const { settings, loading } = useHomepageSettings();

  if (loading) {
    return (
      <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
        <strong>Debug:</strong> Chargement des paramètres entreprise...
      </div>
    );
  }

  return (
    <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4">
      <h3 className="font-bold mb-2">🔍 Debug - Informations Entreprise</h3>
      <div className="text-sm space-y-1">
        <p><strong>Nom:</strong> {settings?.company_name || 'Non défini'}</p>
        <p><strong>Email:</strong> {settings?.company_email || 'Non défini'}</p>
        <p><strong>Téléphone:</strong> {settings?.company_phone || 'Non défini'}</p>
        <p><strong>Logo URL:</strong> {settings?.company_logo_url || 'Non défini'}</p>
        <p><strong>Site web:</strong> {settings?.company_website || 'Non défini'}</p>
        <p><strong>SIRET:</strong> {settings?.company_siret || 'Non défini'}</p>
        <p><strong>TVA:</strong> {settings?.company_vat_number || 'Non défini'}</p>
        <p><strong>Adresse:</strong> {settings?.company_address || 'Non définie'}</p>
        <p><strong>Description:</strong> {settings?.company_description || 'Non définie'}</p>
      </div>
      
      {settings?.company_logo_url && (
        <div className="mt-2">
          <p className="font-semibold">Logo:</p>
          <img 
            src={settings.company_logo_url} 
            alt="Logo entreprise" 
            className="h-16 w-auto border border-gray-300 rounded"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              console.error('Erreur chargement logo:', settings.company_logo_url);
            }}
            onLoad={() => {
              console.log('✅ Logo chargé avec succès:', settings.company_logo_url);
            }}
          />
        </div>
      )}
    </div>
  );
};
