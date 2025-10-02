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

async function checkKBArticles() {
  try {
    console.log('🔍 Vérification des articles de base de connaissances...');

    // Vérifier tous les articles
    const allArticles = await pool.query(`
      SELECT 
        kb.*,
        u.full_name as author_name,
        u.email as author_email
      FROM knowledge_base kb
      LEFT JOIN profiles u ON kb.author_id = u.id
      ORDER BY kb.created_at DESC
    `);
    
    console.log(`📚 ${allArticles.rows.length} articles trouvés au total:`);
    allArticles.rows.forEach(article => {
      console.log(`  - ${article.title} (${article.category}) - Publié: ${article.is_published} - Auteur: ${article.author_name || 'N/A'}`);
    });

    // Vérifier les articles publiés
    const publishedArticles = await pool.query(`
      SELECT 
        kb.*,
        u.full_name as author_name,
        u.email as author_email
      FROM knowledge_base kb
      LEFT JOIN profiles u ON kb.author_id = u.id
      WHERE kb.is_published = true
      ORDER BY kb.created_at DESC
    `);
    
    console.log(`\n✅ ${publishedArticles.rows.length} articles publiés:`);
    publishedArticles.rows.forEach(article => {
      console.log(`  - ${article.title} (${article.category}) - Auteur: ${article.author_name || 'N/A'}`);
    });

    // Vérifier les articles non publiés
    const unpublishedArticles = await pool.query(`
      SELECT 
        kb.*,
        u.full_name as author_name,
        u.email as author_email
      FROM knowledge_base kb
      LEFT JOIN profiles u ON kb.author_id = u.id
      WHERE kb.is_published = false OR kb.is_published IS NULL
      ORDER BY kb.created_at DESC
    `);
    
    console.log(`\n❌ ${unpublishedArticles.rows.length} articles non publiés:`);
    unpublishedArticles.rows.forEach(article => {
      console.log(`  - ${article.title} (${article.category}) - Publié: ${article.is_published} - Auteur: ${article.author_name || 'N/A'}`);
    });

    // Si il y a des articles non publiés, les publier
    if (unpublishedArticles.rows.length > 0) {
      console.log('\n🔧 Publication des articles non publiés...');
      for (const article of unpublishedArticles.rows) {
        await pool.query(`
          UPDATE knowledge_base 
          SET is_published = true 
          WHERE id = $1
        `, [article.id]);
        console.log(`✅ Article "${article.title}" publié`);
      }
    }

    // Vérifier le résultat final
    const finalArticles = await pool.query(`
      SELECT 
        kb.*,
        u.full_name as author_name,
        u.email as author_email
      FROM knowledge_base kb
      LEFT JOIN profiles u ON kb.author_id = u.id
      WHERE kb.is_published = true
      ORDER BY kb.created_at DESC
    `);
    
    console.log(`\n🎉 ${finalArticles.rows.length} articles publiés au final:`);
    finalArticles.rows.forEach(article => {
      console.log(`  - ${article.title} (${article.category}) - Auteur: ${article.author_name || 'N/A'}`);
    });

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await pool.end();
  }
}

checkKBArticles();
