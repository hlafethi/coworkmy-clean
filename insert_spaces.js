const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'coworkmy',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password'
});

const spaces = [
  // Bureaux individuels à l'heure
  {
    name: '🟩 Le Cocoon – À l\'heure',
    description: 'Louez un bureau privé à l\'heure, pour vos besoins ponctuels.\n✅ Wifi – cuisine – sanitaires. Impression disponible.\n💶 24 €/h TTC.',
    capacity: 1,
    price_per_hour: 24.00,
    is_active: true
  },
  {
    name: '🟩 Le Focus – À l\'heure',
    description: 'Un espace confidentiel loué à l\'heure pour travailler ou recevoir.\n✅ Wifi – cuisine – sanitaires. Impression en supplément.\n💶 24 €/h TTC.',
    capacity: 1,
    price_per_hour: 24.00,
    is_active: true
  },
  {
    name: '🟩 Open Space – À l\'heure',
    description: 'Un bureau partagé flexible à l\'heure, pour répondre à vos besoins immédiats.\n✅ Wifi gratuit – accès cuisine – sanitaires. Impression en supplément.\n💶 12 €/h TTC.\nLa solution parfaite pour une session de travail rapide ou un rendez-vous.',
    capacity: 10,
    price_per_hour: 12.00,
    is_active: true
  },
  {
    name: '🟥 Salle de Réunion – À l\'heure',
    description: 'Une salle de réunion moderne pouvant accueillir jusqu\'à 12 personnes.\n✅ TV murale – wifi – tableau – cuisine – sanitaires.\n💶 60 €/h TTC.\nIdéal pour vos réunions, formations ou présentations.',
    capacity: 12,
    price_per_hour: 60.00,
    is_active: true
  },
  // Bureaux individuels demi-journée
  {
    name: '🟦 Le Cocoon – Demi-journée',
    description: 'Un bureau individuel parfait pour une demi-journée de travail en toute tranquillité.\n✅ Wifi – cuisine – sanitaires. Impression en supplément.\n💶 30 €/demi-journée TTC.',
    capacity: 1,
    price_per_hour: 30.00,
    is_active: true
  },
  {
    name: '🟦 Le Focus – Demi-journée',
    description: 'Un bureau privé et confortable pour une demi-journée productive.\n✅ Wifi – cuisine – sanitaires. Impression disponible.\n💶 30 €/demi-journée TTC.',
    capacity: 1,
    price_per_hour: 30.00,
    is_active: true
  },
  {
    name: '🟦 Open Space – Demi-journée',
    description: 'Un poste de travail partagé pour une demi-journée de collaboration et de concentration.\n✅ Wifi inclus – accès cuisine – sanitaires. Impression en option.\n💶 18 €/demi-journée TTC.\nIdéal pour vos missions ponctuelles ou rendez-vous professionnels.',
    capacity: 10,
    price_per_hour: 18.00,
    is_active: true
  },
  {
    name: '🟧 Salle de Réunion – Demi-journée',
    description: 'La salle parfaite pour 12 personnes, équipée et lumineuse, pour une demi-journée.\n✅ TV murale – wifi – tableau – cuisine – sanitaires.\n💶 120 €/demi-journée TTC.',
    capacity: 12,
    price_per_hour: 120.00,
    is_active: true
  },
  // Bureaux individuels journée entière
  {
    name: '🟧 Le Cocoon – Journée entière',
    description: 'Un bureau privatif confortable pour travailler toute la journée dans un environnement serein.\n✅ Wifi – cuisine – sanitaires. Impression en option.\n💶 60 €/jour TTC.',
    capacity: 1,
    price_per_hour: 60.00,
    is_active: true
  },
  {
    name: '🟧 Le Focus – Journée entière',
    description: 'Un espace privatif haut de gamme pour une journée entière de travail concentré.\n✅ Wifi – cuisine – sanitaires. Impression en option.\n💶 60 €/jour TTC.',
    capacity: 1,
    price_per_hour: 60.00,
    is_active: true
  },
  {
    name: '🟧 Open Space – Journée entière',
    description: 'Travaillez toute la journée dans un open space stimulant avec 10 postes disponibles.\n✅ Wifi haut débit – accès à la cuisine – sanitaires. Impression disponible.\n💶 36 €/jour TTC.\nL\'environnement idéal pour une journée productive entouré d\'autres talents.',
    capacity: 10,
    price_per_hour: 36.00,
    is_active: true
  },
  {
    name: '🟦 Salle de Réunion – Journée entière',
    description: 'Votre salle de réunion premium pour 12 personnes, toute la journée.\n✅ TV murale – wifi – tableau – cuisine – sanitaires.\n💶 240 €/jour TTC.',
    capacity: 12,
    price_per_hour: 240.00,
    is_active: true
  },
  // Bureaux au mois
  {
    name: '🟥 Le Cocoon – Au mois',
    description: 'Votre bureau individuel privatif réservé au mois, calme et équipé.\n✅ Engagement minimum de 3 mois, paiement mensuel.\n✅ Wifi illimité – cuisine – sanitaires. Impression sur demande.\n💶 360 €/mois TTC.\nUn espace confidentiel et professionnel, idéal pour indépendants ou télétravailleurs.',
    capacity: 1,
    price_per_hour: 360.00,
    is_active: true
  },
  {
    name: '🟥 Le Focus – Au mois',
    description: 'Un bureau individuel premium, réservé au mois, offrant confort et discrétion.\n✅ Engagement minimum de 3 mois, paiement mensuel.\n✅ Wifi illimité – cuisine – sanitaires. Impression à la demande.\n💶 360 €/mois TTC.',
    capacity: 1,
    price_per_hour: 360.00,
    is_active: true
  },
  {
    name: '🟥 Open Space – Au mois',
    description: 'Un espace partagé lumineux et convivial pour 10 personnes, réservé au mois.\n✅ Engagement minimum de 3 mois, paiement mensuel.\n✅ Wifi gratuit – cuisine partagée – sanitaires. Impression en option.\n💶 240 €/mois TTC.\nUn cadre flexible et dynamique pour les professionnels nomades ou startups.',
    capacity: 10,
    price_per_hour: 240.00,
    is_active: true
  },
  {
    name: '🟩 Le Studio – Bureau individuel 3',
    description: '✅ Engagement minimum de 3 mois, paiement mensuel.\n✅ Wifi illimité – cuisine – sanitaires. Impression à la demande.\n💶 600 €/mois TTC.\nUn espace exclusif et professionnel pour développer vos projets.',
    capacity: 1,
    price_per_hour: 600.00,
    is_active: true
  },
  {
    name: '🟩 Le Studio – Bureau individuel 4',
    description: 'Votre bureau individuel haut standing, réservé au mois pour 1 personne.\n✅ Engagement minimum de 3 mois, paiement mensuel.\n✅ Wifi illimité – cuisine – sanitaires. Impression à la demande.\n💶 600 €/mois TTC.\nUn espace exclusif et professionnel pour développer vos projets.',
    capacity: 1,
    price_per_hour: 600.00,
    is_active: true
  },
  {
    name: '🟧 Le Partage – Bureau individuel dans espace partagé',
    description: 'Un poste de travail individuel dans un espace partagé convivial, jusqu\'à 6 coworkers.\n✅ Engagement minimum de 3 mois, paiement mensuel.\n✅ Wifi – cuisine – sanitaires. Impression en option.\n💶 300 €/mois TTC.',
    capacity: 1,
    price_per_hour: 300.00,
    is_active: true
  }
];

async function insertSpaces() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Début de l\'insertion des espaces...');
    
    // Vérifier si la table existe
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'spaces'
      );
    `);
    
    if (!tableExists.rows[0].exists) {
      console.log('❌ La table "spaces" n\'existe pas. Création...');
      await client.query(`
        CREATE TABLE spaces (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          capacity INTEGER NOT NULL,
          price_per_hour DECIMAL(10,2),
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `);
      console.log('✅ Table "spaces" créée');
    }
    
    // Vider la table avant insertion
    await client.query('DELETE FROM spaces');
    console.log('🧹 Table "spaces" vidée');
    
    // Insérer les espaces
    for (const space of spaces) {
      await client.query(`
        INSERT INTO spaces (name, description, capacity, price_per_hour, is_active, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      `, [space.name, space.description, space.capacity, space.price_per_hour, space.is_active]);
      console.log(`✅ Espace inséré: ${space.name}`);
    }
    
    // Vérifier les insertions
    const result = await client.query('SELECT COUNT(*) as total FROM spaces');
    console.log(`🎉 Insertion terminée! ${result.rows[0].total} espaces insérés`);
    
    // Afficher la liste des espaces
    const spacesList = await client.query('SELECT name, capacity, price_per_hour FROM spaces ORDER BY name');
    console.log('\n📋 Liste des espaces:');
    spacesList.rows.forEach(space => {
      console.log(`- ${space.name} (${space.capacity} pers.) - ${space.price_per_hour}€/h`);
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'insertion:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

insertSpaces();
