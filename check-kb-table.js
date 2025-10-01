const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'coworkmy',
  password: 'admin123',
  port: 5432,
});

async function checkTable() {
  try {
    console.log('🔍 Vérification de la table knowledge_base...');
    const result = await pool.query("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'knowledge_base')");
    console.log('📊 Table knowledge_base existe:', result.rows[0].exists);
    
    if (!result.rows[0].exists) {
      console.log('📝 Création de la table knowledge_base...');
      await pool.query(`
        CREATE TABLE knowledge_base (
          id SERIAL PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          content TEXT NOT NULL,
          category VARCHAR(100),
          tags TEXT[],
          is_published BOOLEAN DEFAULT false,
          author_id UUID REFERENCES profiles(id),
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);
      console.log('✅ Table knowledge_base créée');
    } else {
      console.log('✅ Table knowledge_base existe déjà');
    }
    
    await pool.end();
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

checkTable();
