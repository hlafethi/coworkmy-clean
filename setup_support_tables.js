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

async function setupSupportTables() {
  try {
    console.log('🔧 Configuration des tables support...');

    // Créer les tables support
    await pool.query(`
      CREATE TABLE IF NOT EXISTS support_tickets (
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

    await pool.query(`
      CREATE TABLE IF NOT EXISTS support_faqs (
        id SERIAL PRIMARY KEY,
        question TEXT NOT NULL,
        answer TEXT NOT NULL,
        category VARCHAR(100),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS support_ticket_responses (
        id SERIAL PRIMARY KEY,
        ticket_id INTEGER NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
        message TEXT NOT NULL,
        is_admin_response BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Insérer des FAQ d'exemple
    await pool.query(`
      INSERT INTO support_faqs (question, answer, category) VALUES
      ('Comment reserver un espace ?', 'Vous pouvez reserver un espace en cliquant sur le bouton Reserver de l espace souhaite.', 'Reservation'),
      ('Quels sont les moyens de paiement ?', 'Nous acceptons les cartes bancaires et les virements.', 'Paiement'),
      ('Puis-je annuler ma reservation ?', 'Oui, vous pouvez annuler votre reservation jusqu a 24h avant la date prevue.', 'Annulation')
      ON CONFLICT DO NOTHING
    `);

    console.log('✅ Tables support créées avec succès');
    
    // Vérifier les tables
    const ticketsCount = await pool.query('SELECT COUNT(*) FROM support_tickets');
    const faqsCount = await pool.query('SELECT COUNT(*) FROM support_faqs');
    
    console.log(`📊 support_tickets: ${ticketsCount.rows[0].count} entrées`);
    console.log(`📊 support_faqs: ${faqsCount.rows[0].count} entrées`);

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await pool.end();
  }
}

setupSupportTables();
