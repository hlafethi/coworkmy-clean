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

async function testSupportEndpoints() {
  try {
    console.log('🧪 Test des endpoints support...');

    // Test 1: Vérifier les FAQ
    console.log('\n📋 Test FAQ:');
    const faqs = await pool.query('SELECT * FROM support_faqs WHERE is_active = true ORDER BY order_index ASC, id ASC');
    console.log(`✅ ${faqs.rows.length} FAQ actives trouvées`);
    faqs.rows.forEach(faq => {
      console.log(`  - ${faq.question} (${faq.category})`);
    });

    // Test 2: Vérifier les articles KB
    console.log('\n📚 Test Articles KB:');
    const kbArticles = await pool.query(`
      SELECT 
        kb.*,
        u.full_name as author_name,
        u.email as author_email
      FROM knowledge_base kb
      LEFT JOIN profiles u ON kb.author_id = u.id
      WHERE kb.is_published = true
      ORDER BY kb.created_at DESC
    `);
    console.log(`✅ ${kbArticles.rows.length} articles KB publiés trouvés`);
    kbArticles.rows.forEach(article => {
      console.log(`  - ${article.title} (${article.category}) - Auteur: ${article.author_name || 'N/A'}`);
    });

    // Test 3: Vérifier les tickets existants
    console.log('\n🎫 Test Tickets:');
    const tickets = await pool.query('SELECT * FROM support_tickets ORDER BY created_at DESC');
    console.log(`✅ ${tickets.rows.length} tickets trouvés`);
    tickets.rows.forEach(ticket => {
      console.log(`  - ${ticket.subject} (${ticket.status}) - User: ${ticket.user_id}`);
    });

    // Test 4: Vérifier la structure des tables
    console.log('\n🏗️ Test Structure:');
    
    const faqStructure = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'support_faqs'
      ORDER BY ordinal_position
    `);
    console.log('📋 Structure support_faqs:');
    faqStructure.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });

    const kbStructure = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'knowledge_base'
      ORDER BY ordinal_position
    `);
    console.log('📚 Structure knowledge_base:');
    kbStructure.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });

    console.log('\n✅ Tous les tests sont passés !');

  } catch (error) {
    console.error('❌ Erreur lors des tests:', error);
  } finally {
    await pool.end();
  }
}

testSupportEndpoints();
