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

async function fixKBAutoPublish() {
  try {
    console.log('🔧 Configuration de la publication automatique des articles KB...');

    // Vérifier la structure de la table
    const columns = await pool.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns 
      WHERE table_name = 'knowledge_base' AND column_name = 'is_published'
    `);
    
    console.log('📊 Structure actuelle is_published:', columns.rows);

    // Modifier la colonne pour avoir une valeur par défaut
    await pool.query(`
      ALTER TABLE knowledge_base 
      ALTER COLUMN is_published SET DEFAULT true
    `);
    
    console.log('✅ Valeur par défaut true ajoutée à is_published');

    // Mettre à jour tous les articles existants sans valeur
    await pool.query(`
      UPDATE knowledge_base 
      SET is_published = true 
      WHERE is_published IS NULL
    `);
    
    console.log('✅ Articles existants mis à jour');

    // Vérifier le résultat
    const articles = await pool.query(`
      SELECT 
        kb.*,
        u.full_name as author_name
      FROM knowledge_base kb
      LEFT JOIN profiles u ON kb.author_id = u.id
      ORDER BY kb.created_at DESC
    `);
    
    console.log(`\n📚 ${articles.rows.length} articles au total:`);
    articles.rows.forEach(article => {
      console.log(`  - ${article.title} (${article.category}) - Publié: ${article.is_published} - Auteur: ${article.author_name || 'N/A'}`);
    });

    console.log('\n✅ Configuration terminée ! Les nouveaux articles seront automatiquement publiés.');

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await pool.end();
  }
}

fixKBAutoPublish();
