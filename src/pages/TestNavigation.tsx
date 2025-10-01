import { Link } from 'react-router-dom';

export default function TestNavigation() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-8">
          Page de Test - Navigation
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Tests Homepage</h2>
            <div className="space-y-3">
              <Link 
                to="/test-homepage" 
                className="block w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 text-center"
              >
                Test Homepage avec informations entreprise
              </Link>
              <Link 
                to="/" 
                className="block w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 text-center"
              >
                Homepage normale
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Tests Admin</h2>
            <div className="space-y-3">
              <Link 
                to="/admin" 
                className="block w-full bg-purple-600 text-white py-2 px-4 rounded hover:bg-purple-700 text-center"
              >
                Interface Admin
              </Link>
              <Link 
                to="/profile" 
                className="block w-full bg-orange-600 text-white py-2 px-4 rounded hover:bg-orange-700 text-center"
              >
                Profil Utilisateur
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-white rounded-lg shadow-md p-6 max-w-4xl mx-auto">
          <h2 className="text-xl font-semibold mb-4">Instructions de test</h2>
          <div className="space-y-2 text-gray-600">
            <p>1. <strong>Test Homepage :</strong> Vérifiez que les informations de l'entreprise s'affichent</p>
            <p>2. <strong>Interface Admin :</strong> Allez dans Paramètres → Entreprise pour modifier les informations</p>
            <p>3. <strong>Vérification :</strong> Les modifications doivent apparaître sur la homepage</p>
          </div>
        </div>
      </div>
    </div>
  );
}
