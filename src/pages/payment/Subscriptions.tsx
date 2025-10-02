export default function Subscriptions() {
  console.log('🔍 Page Subscriptions chargée');
  
  return (
    <div style={{ padding: '20px', backgroundColor: '#f0f0f0', minHeight: '100vh' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Mes abonnements</h1>
      <p style={{ marginBottom: '2rem' }}>Gérez vos abonnements et méthodes de paiement</p>
      
      <div style={{ 
        backgroundColor: 'white', 
        padding: '2rem', 
        borderRadius: '8px', 
        textAlign: 'center',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{ 
          backgroundColor: '#dcfce7', 
          width: '64px', 
          height: '64px', 
          borderRadius: '50%', 
          margin: '0 auto 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          💳
        </div>
        
        <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>
          Portail d'abonnements Stripe
        </h3>
        
        <p style={{ marginBottom: '1.5rem', color: '#666' }}>
          Gérez vos abonnements, mettez à jour vos méthodes de paiement, 
          consultez votre historique de facturation et bien plus encore.
        </p>
        
        <button 
          onClick={() => {
            console.log('🔄 Redirection vers Stripe...');
            alert('Redirection vers Stripe (fonctionnalité à implémenter)');
          }}
          style={{
            backgroundColor: '#16a34a',
            color: 'white',
            padding: '0.75rem 1.5rem',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '1rem'
          }}
        >
          🔗 Accéder au portail d'abonnements
        </button>
        
        <p style={{ fontSize: '0.875rem', color: '#666', marginTop: '1rem' }}>
          Vous serez redirigé vers un environnement sécurisé géré par Stripe
        </p>
      </div>
    </div>
  );
}
