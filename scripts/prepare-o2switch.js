/**
 * Script pour préparer les fichiers pour le déploiement sur o2switch
 * Ce script exécute les scripts de modification d'index.html en fonction du système d'exploitation
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

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
 * Vérifie si le dossier dist existe
 * @returns {boolean} - true si le dossier dist existe, false sinon
 */
function checkDistFolder() {
  const distPath = path.join(__dirname, '..', 'dist');
  if (!fs.existsSync(distPath)) {
    colorLog('Le dossier dist n\'existe pas. Veuillez d\'abord construire l\'application avec npm run build.', colors.fg.red);
    return false;
  }
  return true;
}

/**
 * Exécute le script de modification d'index.html en fonction du système d'exploitation
 */
function runModifyScript() {
  const isWindows = os.platform() === 'win32';
  const scriptPath = isWindows ? 'modify-index-html.ps1' : './modify-index-html.sh';
  
  colorLog(`Exécution du script ${scriptPath}...`, colors.fg.blue);
  
  try {
    if (isWindows) {
      // Sur Windows, exécuter le script PowerShell
      execSync('powershell -ExecutionPolicy Bypass -File .\\modify-index-html.ps1', { 
        stdio: 'inherit',
        cwd: path.join(__dirname, '..')
      });
    } else {
      // Sur Linux/Mac, exécuter le script Bash
      execSync('bash ./modify-index-html.sh', { 
        stdio: 'inherit',
        cwd: path.join(__dirname, '..')
      });
    }
    
    colorLog('Script exécuté avec succès.', colors.fg.green);
    return true;
  } catch (error) {
    colorLog(`Erreur lors de l'exécution du script : ${error.message}`, colors.fg.red);
    return false;
  }
}

/**
 * Vérifie que les fichiers nécessaires ont été créés
 * @returns {boolean} - true si tous les fichiers nécessaires existent, false sinon
 */
function checkFiles() {
  const distPath = path.join(__dirname, '..', 'dist');
  const files = ['env.js', 'disable-sentry.js', '.htaccess'];
  
  let allFilesExist = true;
  
  for (const file of files) {
    const filePath = path.join(distPath, file);
    if (!fs.existsSync(filePath)) {
      colorLog(`Le fichier ${file} n'a pas été créé.`, colors.fg.red);
      allFilesExist = false;
    }
  }
  
  if (allFilesExist) {
    colorLog('Tous les fichiers nécessaires ont été créés.', colors.fg.green);
  }
  
  return allFilesExist;
}

/**
 * Fonction principale
 */
function main() {
  colorLog('==============================================', colors.fg.yellow);
  colorLog('Préparation des fichiers pour o2switch', colors.fg.yellow);
  colorLog('==============================================', colors.fg.yellow);
  console.log('');
  
  // Vérifier si le dossier dist existe
  if (!checkDistFolder()) {
    process.exit(1);
  }
  
  // Exécuter le script de modification d'index.html
  if (!runModifyScript()) {
    process.exit(1);
  }
  
  // Vérifier que les fichiers nécessaires ont été créés
  if (!checkFiles()) {
    process.exit(1);
  }
  
  console.log('');
  colorLog('==============================================', colors.fg.green);
  colorLog('Préparation terminée avec succès !', colors.fg.green);
  colorLog('Vous pouvez maintenant déployer le contenu du dossier dist sur o2switch.', colors.fg.green);
  colorLog('==============================================', colors.fg.green);
}

// Exécuter la fonction principale
main();
