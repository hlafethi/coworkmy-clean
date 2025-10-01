import { useHomepageSettings } from '@/hooks/useHomepageSettings';
import { useState } from 'react';

export default function CompanyDataDebug() {
  const { settings, loading, refetch } = useHomepageSettings();
  const [isRefreshing, setIsRefreshing] = useState(false);

  console.log("🔍 CompanyDataDebug - settings:", settings);
  console.log("🔍 CompanyDataDebug - loading:", loading);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  if (loading) {
    return (
      <div className="p-4 bg-yellow-100 border border-yellow-400 rounded">
        <h3 className="font-bold text-yellow-800">🔄 Chargement des données...</h3>
      </div>
    );
  }

  return (
    <div className="p-4 bg-red-200 border-4 border-red-500 rounded-lg shadow-lg mb-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-red-800 text-lg">🔍 DEBUG - DONNÉES ENTREPRISE</h3>
        <button 
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {isRefreshing ? '🔄' : '🔄'} Recharger
        </button>
      </div>
      
      <div className="space-y-2 text-sm">
        <div><strong>Nom:</strong> {settings?.company_name || '❌ Non défini'}</div>
        <div><strong>Email:</strong> {settings?.company_email || '❌ Non défini'}</div>
        <div><strong>Téléphone:</strong> {settings?.company_phone || '❌ Non défini'}</div>
        <div><strong>Adresse:</strong> {settings?.company_address || '❌ Non défini'}</div>
        <div><strong>Site web:</strong> {settings?.company_website || '❌ Non défini'}</div>
        <div><strong>Logo URL:</strong> {settings?.company_logo_url ? '✅ Défini' : '❌ Non défini'}</div>
        <div><strong>SIRET:</strong> {settings?.company_siret || '❌ Non défini'}</div>
        <div><strong>TVA:</strong> {settings?.company_vat_number || '❌ Non défini'}</div>
      </div>
      
      {settings?.company_logo_url && (
        <div className="mt-4">
          <strong>Logo:</strong>
          <img 
            src={settings.company_logo_url} 
            alt="Logo entreprise" 
            className="h-16 w-auto object-contain border"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              console.error('Erreur de chargement du logo');
            }}
          />
        </div>
      )}
    </div>
  );
}
