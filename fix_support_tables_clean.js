import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  host: '147.93.58.155',
  port: 5432,
  database: 'coworkmy',
  user: 'vpshostinger',
  password: 'Fethi@2025!',
  ssl: { rejectUnauthorized: false }
});

async function fixSupportTablesClean() {
  try {
    console.log('🔧 Nettoyage et correction des tables support...');

    // Supprimer toutes les données existantes
    console.log('🗑️ Suppression des données existantes...');
    await pool.query('DELETE FROM support_ticket_responses');
    await pool.query('DELETE FROM support_tickets');
    
    // Supprimer et recréer la table support_tickets avec la bonne structure
    console.log('🔄 Recréation de la table support_tickets...');
    await pool.query('DROP TABLE IF EXISTS support_tickets CASCADE');
    
    await pool.query(`
      CREATE TABLE support_tickets (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        subject VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        priority VARCHAR(50) DEFAULT 'medium',
        status VARCHAR(50) DEFAULT 'open',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Recréer la table support_ticket_responses
    await pool.query('DROP TABLE IF EXISTS support_ticket_responses CASCADE');
    
    await pool.query(`
      CREATE TABLE support_ticket_responses (
        id SERIAL PRIMARY KEY,
        ticket_id INTEGER NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
        message TEXT NOT NULL,
        is_admin_response BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Insérer des tickets d'exemple avec des IDs numériques
    console.log('📝 Insertion de tickets d\'exemple...');
    await pool.query(`
      INSERT INTO support_tickets (user_id, subject, message, priority, status) VALUES
      (2, 'Probleme de connexion', 'Je n arrive pas a me connecter a mon compte', 'high', 'open'),
      (2, 'Question sur les tarifs', 'Quels sont les tarifs pour les espaces de travail ?', 'medium', 'open'),
      (2, 'Demande d information', 'Pouvez-vous me donner plus d informations sur vos services ?', 'low', 'closed')
    `);

    console.log('✅ Tables support corrigées avec succès');
    
    // Vérifier la structure
    const columns = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'support_tickets' AND column_name = 'user_id'
    `);
    
    console.log('📊 Structure user_id:', columns.rows);

    // Tester une requête
    const testResult = await pool.query(`
      SELECT * FROM support_tickets WHERE user_id = $1
    `, [2]);
    
    console.log('✅ Test de requête réussi:', testResult.rows.length, 'tickets trouvés');

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await pool.end();
  }
}

fixSupportTablesClean();
