// Script pour vérifier les espaces dans la base de données
import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  host: '147.93.58.155',
  port: 5432,
  database: 'coworkmy',
  user: 'vpshostinger',
  password: 'Fethi@2025!',
});

async function checkSpaces() {
  try {
    console.log('🔍 Vérification des espaces dans la base de données...');
    
    // Vérifier la structure de la table spaces
    console.log('\n1. Structure de la table spaces:');
    const structureResult = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'spaces' 
      ORDER BY ordinal_position
    `);
    
    console.log('Colonnes disponibles:');
    structureResult.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });
    
    // Vérifier les espaces existants
    console.log('\n2. Espaces existants:');
    const spacesResult = await pool.query(`
      SELECT 
        id, 
        name, 
        description, 
        is_active,
        pricing_type,
        hourly_price,
        daily_price,
        monthly_price,
        created_at
      FROM spaces 
      ORDER BY created_at DESC
    `);
    
    if (spacesResult.rows.length === 0) {
      console.log('❌ Aucun espace trouvé dans la base de données');
    } else {
      console.log(`✅ ${spacesResult.rows.length} espace(s) trouvé(s):`);
      spacesResult.rows.forEach((space, index) => {
        console.log(`\n  ${index + 1}. ${space.name}`);
        console.log(`     - ID: ${space.id}`);
        console.log(`     - Actif: ${space.is_active ? 'Oui' : 'Non'}`);
        console.log(`     - Type de tarif: ${space.pricing_type || 'Non défini'}`);
        console.log(`     - Prix horaire: ${space.hourly_price || 0}€`);
        console.log(`     - Prix journalier: ${space.daily_price || 0}€`);
        console.log(`     - Prix mensuel: ${space.monthly_price || 0}€`);
        console.log(`     - Créé le: ${space.created_at}`);
      });
    }
    
    // Vérifier les espaces actifs
    console.log('\n3. Espaces actifs uniquement:');
    const activeSpacesResult = await pool.query(`
      SELECT id, name, is_active, pricing_type, hourly_price
      FROM spaces 
      WHERE is_active = true
      ORDER BY created_at DESC
    `);
    
    if (activeSpacesResult.rows.length === 0) {
      console.log('❌ Aucun espace actif trouvé');
    } else {
      console.log(`✅ ${activeSpacesResult.rows.length} espace(s) actif(s):`);
      activeSpacesResult.rows.forEach((space, index) => {
        console.log(`  ${index + 1}. ${space.name} (ID: ${space.id}) - ${space.hourly_price || 0}€/h`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
  } finally {
    await pool.end();
  }
}

// Exécuter la vérification
checkSpaces();
