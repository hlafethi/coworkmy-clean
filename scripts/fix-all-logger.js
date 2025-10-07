import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Fonction pour traiter un fichier
function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Supprimer les imports de logger
    const loggerImportRegex = /import\s*{\s*logger\s*}\s*from\s*['"]@\/utils\/logger['"];?\s*\n?/g;
    if (content.match(loggerImportRegex)) {
      content = content.replace(loggerImportRegex, '// Logger supprimé - utilisation de console directement\n');
      modified = true;
    }

    // Remplacer tous les logger.* par console.*
    const loggerRegex = /logger\.(debug|info|warn|error|log|dev)/g;
    if (content.match(loggerRegex)) {
      content = content.replace(loggerRegex, (match, method) => {
        if (method === 'warn') return 'console.warn';
        if (method === 'error') return 'console.error';
        return 'console.log';
      });
      modified = true;
    }

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Corrigé: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Erreur avec ${filePath}:`, error.message);
  }
}

// Fonction récursive pour parcourir les dossiers
function processDirectory(dirPath) {
  const items = fs.readdirSync(dirPath);
  
  for (const item of items) {
    const fullPath = path.join(dirPath, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
      processDirectory(fullPath);
    } else if (item.endsWith('.ts') || item.endsWith('.tsx') || item.endsWith('.js') || item.endsWith('.jsx')) {
      processFile(fullPath);
    }
  }
}

// Traiter le dossier src
const srcPath = path.join(__dirname, '..', 'src');
console.log('🧹 Correction de tous les fichiers avec logger...');
processDirectory(srcPath);
console.log('✅ Terminé !');
