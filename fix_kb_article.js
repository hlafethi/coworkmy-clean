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

async function fixKBArticle() {
  try {
    console.log('🔧 Correction de l\'article de base de connaissances...');

    // Vérifier l'article existant
    const existing = await pool.query('SELECT * FROM knowledge_base');
    console.log('📚 Articles existants:', existing.rows);

    if (existing.rows.length > 0) {
      const article = existing.rows[0];
      console.log('📝 Article trouvé:', {
        id: article.id,
        title: article.title,
        is_published: article.is_published,
        category: article.category
      });

      // Mettre à jour l'article pour qu'il soit publié
      await pool.query(`
        UPDATE knowledge_base 
        SET is_published = true, 
            title = 'Guide d''utilisation des espaces de coworking',
            content = 'Ce guide vous explique comment utiliser efficacement nos espaces de coworking. Vous y trouverez toutes les informations nécessaires pour réserver, utiliser et optimiser votre expérience dans nos espaces.',
            category = 'guide',
            tags = ARRAY['guide', 'utilisation', 'coworking']
        WHERE id = $1
      `, [article.id]);

      console.log('✅ Article mis à jour et publié');
    } else {
      // Créer un nouvel article
      await pool.query(`
        INSERT INTO knowledge_base (title, content, category, tags, is_published, author_id, created_at, updated_at)
        VALUES (
          'Guide d''utilisation des espaces de coworking',
          'Ce guide vous explique comment utiliser efficacement nos espaces de coworking. Vous y trouverez toutes les informations nécessaires pour réserver, utiliser et optimiser votre expérience dans nos espaces.',
          'guide',
          ARRAY['guide', 'utilisation', 'coworking'],
          true,
          (SELECT id FROM profiles WHERE is_admin = true LIMIT 1),
          NOW(),
          NOW()
        )
      `);
      console.log('✅ Nouvel article créé et publié');
    }

    // Vérifier le résultat
    const result = await pool.query('SELECT * FROM knowledge_base WHERE is_published = true');
    console.log('📚 Articles publiés:', result.rows.length);
    result.rows.forEach(article => {
      console.log(`  - ${article.title} (${article.category}) - Publié: ${article.is_published}`);
    });

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await pool.end();
  }
}

fixKBArticle();
