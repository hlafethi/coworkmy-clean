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

async function fixSupportFaqsStructure() {
  try {
    console.log('🔧 Correction de la structure de support_faqs...');

    // Vérifier la structure actuelle
    const columns = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'support_faqs'
      ORDER BY ordinal_position
    `);
    
    console.log('📊 Structure actuelle support_faqs:');
    columns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });

    // Vérifier si author_id existe
    const hasAuthorId = columns.rows.some(col => col.column_name === 'author_id');
    
    if (!hasAuthorId) {
      console.log('➕ Ajout de la colonne author_id...');
      await pool.query(`
        ALTER TABLE support_faqs 
        ADD COLUMN author_id UUID REFERENCES profiles(id)
      `);
      console.log('✅ Colonne author_id ajoutée');
    } else {
      console.log('✅ Colonne author_id existe déjà');
    }

    // Mettre à jour les FAQ existantes avec un auteur par défaut
    const adminUser = await pool.query(`
      SELECT id FROM profiles WHERE is_admin = true LIMIT 1
    `);
    
    if (adminUser.rows.length > 0) {
      const adminId = adminUser.rows[0].id;
      console.log('👤 Admin trouvé:', adminId);
      
      // Mettre à jour les FAQ sans auteur
      await pool.query(`
        UPDATE support_faqs 
        SET author_id = $1 
        WHERE author_id IS NULL
      `, [adminId]);
      
      console.log('✅ FAQ mises à jour avec l\'auteur admin');
    }

    // Vérifier le résultat
    const updatedFaqs = await pool.query(`
      SELECT 
        f.*,
        u.full_name as author_name,
        u.email as author_email
      FROM support_faqs f
      LEFT JOIN profiles u ON f.author_id = u.id
      ORDER BY f.order_index ASC, f.created_at DESC
    `);
    
    console.log(`📋 ${updatedFaqs.rows.length} FAQ avec auteurs:`);
    updatedFaqs.rows.forEach(faq => {
      console.log(`  - ${faq.question} - Auteur: ${faq.author_name || 'N/A'}`);
    });

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await pool.end();
  }
}

fixSupportFaqsStructure();
