/**
 * Script pour générer des fichiers SQL séparés pour la base de données PostgreSQL
 * Ce script génère plusieurs fichiers SQL qui peuvent être exécutés manuellement sur le serveur o2switch
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
 * Crée un dossier s'il n'existe pas
 * @param {string} dirPath - Le chemin du dossier à créer
 */
function createDirIfNotExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Divise le script SQL en plusieurs fichiers
 * @param {string} sql - Le script SQL à diviser
 * @param {string} outputDir - Le dossier de sortie
 */
function splitSqlScript(sql, outputDir) {
  // Créer le dossier de sortie
  createDirIfNotExists(outputDir);
  
  // Diviser le script SQL en requêtes individuelles
  const tables = [];
  const indexes = [];
  const inserts = [];
  const functions = [];
  const triggers = [];
  
  // Extraire les requêtes CREATE TABLE
  const tableRegex = /-- Création de la table des [\s\S]*?CREATE TABLE IF NOT EXISTS (\w+)[\s\S]*?;/g;
  let tableMatch;
  while ((tableMatch = tableRegex.exec(sql)) !== null) {
    const tableName = tableMatch[1];
    const tableQuery = tableMatch[0];
    tables.push({ name: tableName, query: tableQuery });
  }
  
  // Extraire les requêtes CREATE INDEX
  const indexRegex = /-- Index pour les [\s\S]*?(CREATE INDEX IF NOT EXISTS [\s\S]*?;)/g;
  let indexMatch;
  while ((indexMatch = indexRegex.exec(sql)) !== null) {
    const indexQuery = indexMatch[1];
    indexes.push(indexQuery);
  }
  
  // Extraire les requêtes INSERT
  const insertRegex = /-- Insertion [\s\S]*?(INSERT INTO [\s\S]*?;)/g;
  let insertMatch;
  while ((insertMatch = insertRegex.exec(sql)) !== null) {
    const insertQuery = insertMatch[1];
    inserts.push(insertQuery);
  }
  
  // Extraire les fonctions
  const functionRegex = /-- Fonction [\s\S]*?(CREATE OR REPLACE FUNCTION [\s\S]*?\$\$ LANGUAGE plpgsql;)/g;
  let functionMatch;
  while ((functionMatch = functionRegex.exec(sql)) !== null) {
    const functionQuery = functionMatch[1];
    functions.push(functionQuery);
  }
  
  // Extraire les triggers
  const triggerRegex = /CREATE TRIGGER [\s\S]*?;/g;
  let triggerMatch;
  while ((triggerMatch = triggerRegex.exec(sql)) !== null) {
    const triggerQuery = triggerMatch[0];
    triggers.push(triggerQuery);
  }
  
  // Écrire les fichiers SQL
  
  // 1. Tables
  let tablesContent = "-- Création des tables\n\n";
  tables.forEach(table => {
    tablesContent += table.query + "\n\n";
  });
  fs.writeFileSync(path.join(outputDir, '01-tables.sql'), tablesContent);
  
  // 2. Index
  let indexesContent = "-- Création des index\n\n";
  indexes.forEach(index => {
    indexesContent += index + "\n\n";
  });
  fs.writeFileSync(path.join(outputDir, '02-indexes.sql'), indexesContent);
  
  // 3. Fonctions
  let functionsContent = "-- Création des fonctions\n\n";
  functions.forEach(func => {
    functionsContent += func + "\n\n";
  });
  fs.writeFileSync(path.join(outputDir, '03-functions.sql'), functionsContent);
  
  // 4. Triggers
  let triggersContent = "-- Création des triggers\n\n";
  triggersContent += "-- Fonction pour mettre à jour automatiquement le champ updated_at\n";
  triggersContent += "CREATE OR REPLACE FUNCTION update_updated_at_column()\n";
  triggersContent += "RETURNS TRIGGER AS $$\n";
  triggersContent += "BEGIN\n";
  triggersContent += "   NEW.updated_at = NOW();\n";
  triggersContent += "   RETURN NEW;\n";
  triggersContent += "END;\n";
  triggersContent += "$$ LANGUAGE plpgsql;\n\n";
  
  triggers.forEach(trigger => {
    triggersContent += trigger + "\n\n";
  });
  fs.writeFileSync(path.join(outputDir, '04-triggers.sql'), triggersContent);
  
  // 5. Données initiales
  let insertsContent = "-- Insertion des données initiales\n\n";
  inserts.forEach(insert => {
    insertsContent += insert + "\n\n";
  });
  fs.writeFileSync(path.join(outputDir, '05-data.sql'), insertsContent);
  
  // 6. Fichier README
  let readmeContent = "# Fichiers SQL pour PostgreSQL\n\n";
  readmeContent += "Ces fichiers SQL doivent être exécutés dans l'ordre suivant :\n\n";
  readmeContent += "1. `01-tables.sql` - Création des tables\n";
  readmeContent += "2. `02-indexes.sql` - Création des index\n";
  readmeContent += "3. `03-functions.sql` - Création des fonctions\n";
  readmeContent += "4. `04-triggers.sql` - Création des triggers\n";
  readmeContent += "5. `05-data.sql` - Insertion des données initiales\n\n";
  readmeContent += "Exécutez ces fichiers un par un dans l'ordre indiqué pour éviter les erreurs de dépendances.\n";
  fs.writeFileSync(path.join(outputDir, 'README.md'), readmeContent);
}

/**
 * Fonction principale
 */
async function main() {
  colorLog('==============================================', colors.fg.yellow);
  colorLog('Génération des fichiers SQL pour PostgreSQL', colors.fg.yellow);
  colorLog('==============================================', colors.fg.yellow);
  console.log('');
  
  try {
    // Lire le fichier SQL de création des tables
    const sqlFilePath = path.join(__dirname, 'create-postgres-tables-serial.sql');
    colorLog(`Lecture du fichier SQL : ${sqlFilePath}`, colors.fg.blue);
    
    const sql = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Créer le dossier de sortie
    const outputDir = path.join(__dirname, '..', 'postgres-sql');
    colorLog(`Création du dossier de sortie : ${outputDir}`, colors.fg.blue);
    
    // Diviser le script SQL en plusieurs fichiers
    splitSqlScript(sql, outputDir);
    
    colorLog(`Fichiers SQL générés avec succès dans le dossier : ${outputDir}`, colors.fg.green);
    colorLog('Vous pouvez maintenant exécuter ces fichiers sur votre serveur o2switch via phpMyAdmin ou un autre outil d\'administration de base de données.', colors.fg.green);
  } catch (error) {
    colorLog(`Erreur lors de la génération des fichiers SQL : ${error.message}`, colors.fg.red);
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
