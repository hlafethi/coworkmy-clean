import { logger } from '@/utils/logger';
export default function Invoices() {
  logger.debug('🔍 Page Invoices chargée');
  
  return (
    <div style={{ padding: '20px', backgroundColor: '#f0f0f0', minHeight: '100vh' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Mes factures</h1>
      <p style={{ marginBottom: '2rem' }}>Accédez à votre portail de facturation Stripe</p>
      
      <div style={{ 
        backgroundColor: 'white', 
        padding: '2rem', 
        borderRadius: '8px', 
        textAlign: 'center',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{ 
          backgroundColor: '#dbeafe', 
          width: '64px', 
          height: '64px', 
          borderRadius: '50%', 
          margin: '0 auto 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          📄
        </div>
        
        <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>
          Portail de facturation Stripe
        </h3>
        
        <p style={{ marginBottom: '1.5rem', color: '#666' }}>
          Consultez vos factures, téléchargez vos reçus et gérez vos informations de facturation 
          directement depuis votre portail client Stripe sécurisé.
        </p>
        
        <button 
          onClick={() => {
            logger.debug('🔄 Redirection vers Stripe...');
            alert('Redirection vers Stripe (fonctionnalité à implémenter)');
          }}
          style={{
            backgroundColor: '#2563eb',
            color: 'white',
            padding: '0.75rem 1.5rem',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '1rem'
          }}
        >
          🔗 Accéder au portail de facturation
        </button>
        
        <p style={{ fontSize: '0.875rem', color: '#666', marginTop: '1rem' }}>
          Vous serez redirigé vers un environnement sécurisé géré par Stripe
        </p>
      </div>
    </div>
  );
}
