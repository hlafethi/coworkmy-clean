/**
 * Script pour initialiser la base de données PostgreSQL
 * Ce script exécute le fichier SQL de création des tables
 */

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Couleurs pour la console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  hidden: '\x1b[8m',
  
  fg: {
    black: '\x1b[30m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    crimson: '\x1b[38m'
  },
  
  bg: {
    black: '\x1b[40m',
    red: '\x1b[41m',
    green: '\x1b[42m',
    yellow: '\x1b[43m',
    blue: '\x1b[44m',
    magenta: '\x1b[45m',
    cyan: '\x1b[46m',
    white: '\x1b[47m',
    crimson: '\x1b[48m'
  }
};

/**
 * Affiche un message avec une couleur
 * @param {string} message - Le message à afficher
 * @param {string} color - La couleur à utiliser
 */
function colorLog(message, color) {
  if (process.env.NODE_ENV !== 'production') {
    console.log(color + message + colors.reset);
  }
}

/**
 * Demande une confirmation à l'utilisateur
 * @param {string} question - La question à poser
 * @returns {Promise<boolean>} - true si l'utilisateur a répondu oui, false sinon
 */
async function confirm(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => {
    rl.question(question + ' (y/n) ', answer => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

/**
 * Exécute une requête SQL
 * @param {Pool} pool - Le pool de connexions PostgreSQL
 * @param {string} query - La requête SQL à exécuter
 * @returns {Promise<any>} - Le résultat de la requête
 */
async function executeQuery(pool, query) {
  try {
    const result = await pool.query(query);
    return result;
  } catch (error) {
    colorLog(`Erreur lors de l'exécution de la requête : ${error.message}`, colors.fg.red);
    throw error;
  }
}

/**
 * Exécute un fichier SQL
 * @param {Pool} pool - Le pool de connexions PostgreSQL
 * @param {string} filePath - Le chemin du fichier SQL
 * @returns {Promise<void>}
 */
async function executeSqlFile(pool, filePath) {
  try {
    const sql = fs.readFileSync(filePath, 'utf8');
    
    // Diviser le fichier SQL en requêtes individuelles
    const queries = sql.split(';').filter(query => query.trim() !== '');
    
    // Exécuter chaque requête
    for (const query of queries) {
      await executeQuery(pool, query);
    }
    
    colorLog(`Fichier SQL exécuté avec succès : ${filePath}`, colors.fg.green);
  } catch (error) {
    colorLog(`Erreur lors de l'exécution du fichier SQL : ${error.message}`, colors.fg.red);
    throw error;
  }
}

/**
 * Fonction principale
 */
async function main() {
  colorLog('==============================================', colors.fg.yellow);
  colorLog('Initialisation de la base de données PostgreSQL', colors.fg.yellow);
  colorLog('==============================================', colors.fg.yellow);
  console.log('');
  
  // Configuration de la connexion à la base de données
  const config = {
    host: process.env.PG_HOST || '109.234.166.71',
    database: process.env.PG_DATABASE || 'rafi0640_coworkmy',
    user: process.env.PG_USER || 'rafi0640_coworkmyadmin',
    password: process.env.PG_PASSWORD || 'Coworkmy2025!',
    port: parseInt(process.env.PG_PORT || '5432', 10),
    ssl: process.env.PG_SSL === 'true' || false
  };
  
  colorLog(`Connexion à la base de données PostgreSQL...`, colors.fg.blue);
  colorLog(`Host: ${config.host}`, colors.fg.blue);
  colorLog(`Database: ${config.database}`, colors.fg.blue);
  colorLog(`User: ${config.user}`, colors.fg.blue);
  colorLog(`Port: ${config.port}`, colors.fg.blue);
  colorLog(`SSL: ${config.ssl}`, colors.fg.blue);
  console.log('');
  
  // Demander confirmation avant de continuer
  const confirmed = await confirm('Êtes-vous sûr de vouloir initialiser la base de données ? Cela va créer ou remplacer toutes les tables existantes.');
  if (!confirmed) {
    colorLog('Opération annulée.', colors.fg.yellow);
    return;
  }
  
  // Créer le pool de connexions
  const pool = new Pool(config);
  
  try {
    // Tester la connexion
    colorLog('Test de la connexion à la base de données...', colors.fg.blue);
    await pool.query('SELECT NOW()');
    colorLog('Connexion réussie !', colors.fg.green);
    console.log('');
    
    // Exécuter le fichier SQL de création des tables
    const sqlFilePath = path.join(__dirname, 'create-postgres-tables.sql');
    colorLog(`Exécution du fichier SQL : ${sqlFilePath}`, colors.fg.blue);
    await executeSqlFile(pool, sqlFilePath);
    
    colorLog('Base de données initialisée avec succès !', colors.fg.green);
  } catch (error) {
    colorLog(`Erreur lors de l'initialisation de la base de données : ${error.message}`, colors.fg.red);
  } finally {
    // Fermer le pool de connexions
    await pool.end();
  }
  
  console.log('');
  colorLog('==============================================', colors.fg.green);
  colorLog('Opération terminée.', colors.fg.green);
  colorLog('==============================================', colors.fg.green);
}

// Exécuter la fonction principale
main().catch(error => {
  colorLog(`Erreur non gérée : ${error.message}`, colors.fg.red);
  process.exit(1);
});
