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

async function checkSupportTables() {
  try {
    console.log('🔍 Vérification des tables support...');

    // Vérifier support_faqs
    console.log('\n📋 Table support_faqs:');
    const faqs = await pool.query('SELECT * FROM support_faqs ORDER BY id');
    console.log(`✅ ${faqs.rows.length} FAQ trouvées`);
    faqs.rows.forEach(faq => {
      console.log(`  - ${faq.question} (${faq.category}) - Active: ${faq.is_active}`);
    });

    // Vérifier knowledge_base
    console.log('\n📚 Table knowledge_base:');
    const kb = await pool.query('SELECT * FROM knowledge_base ORDER BY id');
    console.log(`✅ ${kb.rows.length} articles trouvés`);
    kb.rows.forEach(article => {
      console.log(`  - ${article.title} (${article.category}) - Publié: ${article.is_published}`);
    });

    // Vérifier la structure des tables
    console.log('\n🏗️ Structure des tables:');
    
    const faqStructure = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'support_faqs'
      ORDER BY ordinal_position
    `);
    console.log('📋 Structure support_faqs:');
    faqStructure.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });

    const kbStructure = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'knowledge_base'
      ORDER BY ordinal_position
    `);
    console.log('📚 Structure knowledge_base:');
    kbStructure.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await pool.end();
  }
}

checkSupportTables();
