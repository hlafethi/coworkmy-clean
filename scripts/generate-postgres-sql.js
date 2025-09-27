/**
 * Script pour générer un fichier SQL pour la base de données PostgreSQL
 * Ce script génère un fichier SQL qui peut être exécuté manuellement sur le serveur o2switch
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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
 * Fonction principale
 */
async function main() {
  colorLog('==============================================', colors.fg.yellow);
  colorLog('Génération du fichier SQL pour PostgreSQL', colors.fg.yellow);
  colorLog('==============================================', colors.fg.yellow);
  console.log('');
  
  try {
    // Lire le fichier SQL de création des tables
    const sqlFilePath = path.join(__dirname, 'create-postgres-tables.sql');
    colorLog(`Lecture du fichier SQL : ${sqlFilePath}`, colors.fg.blue);
    
    const sql = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Générer le fichier SQL
    const outputFilePath = path.join(__dirname, '..', 'postgres-init.sql');
    colorLog(`Génération du fichier SQL : ${outputFilePath}`, colors.fg.blue);
    
    fs.writeFileSync(outputFilePath, sql);
    
    colorLog(`Fichier SQL généré avec succès : ${outputFilePath}`, colors.fg.green);
    colorLog('Vous pouvez maintenant exécuter ce fichier sur votre serveur o2switch via phpMyAdmin ou un autre outil d\'administration de base de données.', colors.fg.green);
  } catch (error) {
    colorLog(`Erreur lors de la génération du fichier SQL : ${error.message}`, colors.fg.red);
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
